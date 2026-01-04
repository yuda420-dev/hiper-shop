-- HiPeR Orders Schema for Supabase
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Orders Table
-- Stores all orders from Stripe checkout
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'usd',
  customer_email TEXT,
  shipping_address JSONB,
  items JSONB,
  metadata JSONB,
  prodigi_order_id TEXT,
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment ON orders(stripe_payment_intent);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything (for webhook)
CREATE POLICY "Service role has full access to orders" ON orders
  FOR ALL USING (true) WITH CHECK (true);

-- Policy: Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.jwt() ->> 'email' = customer_email
  );

-- Policy: Admin can view all orders
CREATE POLICY "Admin can view all orders" ON orders
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'hiper.6258@gmail.com'
  );

-- Policy: Admin can update all orders
CREATE POLICY "Admin can update all orders" ON orders
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = 'hiper.6258@gmail.com'
  );

-- Grant permissions
GRANT ALL ON orders TO service_role;
GRANT SELECT ON orders TO authenticated;
GRANT INSERT ON orders TO anon, authenticated;
