import Stripe from 'stripe';

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if secret key is configured
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('STRIPE_SECRET_KEY is not configured');
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  // Log key prefix for debugging (safe - only shows test/live indicator)
  console.log('Using Stripe key starting with:', secretKey.substring(0, 7));

  try {
    const stripe = new Stripe(secretKey, {
      telemetry: false,
    });

    const { cart, customerEmail } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Get the origin for success/cancel URLs
    const origin = req.headers.origin || 'https://hiper-shop.vercel.app';

    // Map cart items to Stripe line items
    const line_items = cart.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${item.artwork.title} - ${item.size.name}`,
          description: `${item.size.dimensions} with ${item.frame.label || item.frame.name} frame`,
          images: item.artwork.image ? [item.artwork.image] : [],
        },
        unit_amount: Math.round(item.total * 100), // Convert to cents
      },
      quantity: 1,
    }));

    // Create metadata for order processing
    const metadata = {
      cart: JSON.stringify(cart.map(item => ({
        artworkId: item.artwork.id,
        artworkTitle: item.artwork.title,
        artworkImage: item.artwork.image,
        size: item.size.name,
        sizeDimensions: item.size.dimensions,
        frame: item.frame.name,
        frameLabel: item.frame.label,
        price: item.total,
      }))),
    };

    console.log('Creating checkout session with', line_items.length, 'items');

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}?checkout=cancel`,
      customer_email: customerEmail || undefined,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'BE', 'AT', 'CH', 'ES', 'IT', 'IE', 'SE', 'NO', 'DK', 'FI', 'NZ'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0,
              currency: 'usd',
            },
            display_name: 'Standard Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 5,
              },
              maximum: {
                unit: 'business_day',
                value: 10,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 1500, // $15
              currency: 'usd',
            },
            display_name: 'Express Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 2,
              },
              maximum: {
                unit: 'business_day',
                value: 4,
              },
            },
          },
        },
      ],
      metadata,
    });

    console.log('Checkout session created:', session.id);
    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Stripe checkout error:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    return res.status(500).json({ error: error.message });
  }
}
