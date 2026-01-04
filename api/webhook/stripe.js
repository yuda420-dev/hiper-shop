import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Initialize Supabase with service role key for server-side operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export const config = {
  api: {
    bodyParser: false, // Disable body parsing for webhook signature verification
  },
};

// Helper to get raw body
async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers['stripe-signature'];

    let event;

    // Verify webhook signature if secret is configured
    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }
    } else {
      // In development/testing without webhook secret
      event = JSON.parse(rawBody.toString());
      console.warn('Webhook signature not verified - STRIPE_WEBHOOK_SECRET not set');
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        console.log('Checkout session completed:', session.id);

        // Parse cart items from metadata
        let cartItems = [];
        try {
          cartItems = JSON.parse(session.metadata?.cart || '[]');
        } catch (e) {
          console.error('Failed to parse cart metadata:', e);
        }

        // Extract shipping address
        const shippingAddress = session.shipping_details?.address || {};
        const shippingName = session.shipping_details?.name || '';

        // Calculate total
        const totalAmount = session.amount_total / 100; // Convert from cents

        // Create order record in Supabase
        const orderData = {
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
          status: 'paid',
          total_amount: totalAmount,
          currency: session.currency,
          customer_email: session.customer_details?.email || session.customer_email,
          shipping_address: {
            name: shippingName,
            line1: shippingAddress.line1,
            line2: shippingAddress.line2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postal_code: shippingAddress.postal_code,
            country: shippingAddress.country,
          },
          items: cartItems,
          metadata: {
            shipping_cost: session.shipping_cost?.amount_total / 100 || 0,
            payment_status: session.payment_status,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Insert order into Supabase
        const { data, error } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();

        if (error) {
          console.error('Failed to save order to Supabase:', error);
          // Don't fail the webhook - Stripe expects 200
        } else {
          console.log('Order saved to Supabase:', data.id);
        }

        // Track analytics event
        try {
          await supabase.from('analytics_events').insert({
            event_type: 'order_complete',
            order_id: session.id,
            price: totalAmount,
            item_count: cartItems.length,
            created_at: new Date().toISOString(),
          });
        } catch (e) {
          console.error('Failed to track analytics:', e);
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        console.log('Payment failed:', paymentIntent.id);

        // Update order status if exists
        await supabase
          .from('orders')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('stripe_payment_intent', paymentIntent.id);

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
