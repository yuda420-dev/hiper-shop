import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'payment_intent'],
    });

    // Parse cart items from metadata
    let cartItems = [];
    try {
      cartItems = JSON.parse(session.metadata?.cart || '[]');
    } catch (e) {
      console.error('Failed to parse cart metadata:', e);
    }

    const totalAmount = session.amount_total / 100;
    const shippingAddress = session.shipping_details?.address || {};
    const shippingName = session.shipping_details?.name || '';
    const customerEmail = session.customer_details?.email;
    const userId = session.metadata?.user_id || null;

    // Save order to Supabase if payment was successful
    if (session.payment_status === 'paid') {
      // Check if order already exists
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_session_id', session.id)
        .single();

      if (!existingOrder) {
        // Create order record
        const orderData = {
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent?.id,
          status: 'paid',
          total_amount: totalAmount,
          currency: session.currency,
          customer_email: customerEmail,
          user_id: userId || null,
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
        };

        const { data: newOrder, error: insertError } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();

        if (insertError) {
          console.error('Failed to save order:', insertError);
        } else {
          console.log('Order saved:', newOrder.id);
        }
      }
    }

    return res.status(200).json({
      success: session.payment_status === 'paid',
      orderId: session.id,
      paymentIntent: session.payment_intent?.id,
      customerEmail: customerEmail,
      totalAmount: totalAmount,
      currency: session.currency,
      shippingAddress: session.shipping_details,
      items: cartItems,
      paymentStatus: session.payment_status,
    });
  } catch (error) {
    console.error('Order status error:', error);
    return res.status(500).json({ error: error.message });
  }
}
