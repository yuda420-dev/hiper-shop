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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role has full access to orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON orders;
DROP POLICY IF EXISTS "Admin can update all orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
DROP POLICY IF EXISTS "Anyone can read orders by email" ON orders;

-- Policy: Anyone can insert orders (for webhook with anon key)
CREATE POLICY "Anyone can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Policy: Anyone can read orders by email (for order lookup)
CREATE POLICY "Anyone can read orders by email" ON orders
  FOR SELECT USING (true);

-- Policy: Admin can update all orders
CREATE POLICY "Admin can update all orders" ON orders
  FOR UPDATE USING (
    auth.jwt() ->> 'email' = 'hiper.6258@gmail.com'
  );

-- Policy: Admin can delete orders
CREATE POLICY "Admin can delete orders" ON orders
  FOR DELETE USING (
    auth.jwt() ->> 'email' = 'hiper.6258@gmail.com'
  );

-- Grant permissions
GRANT ALL ON orders TO service_role;
GRANT SELECT, INSERT ON orders TO anon;
GRANT SELECT, INSERT ON orders TO authenticated;
