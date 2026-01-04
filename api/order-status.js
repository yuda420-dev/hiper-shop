import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

    return res.status(200).json({
      success: session.payment_status === 'paid',
      orderId: session.id,
      paymentIntent: session.payment_intent?.id,
      customerEmail: session.customer_details?.email,
      totalAmount: session.amount_total / 100,
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
