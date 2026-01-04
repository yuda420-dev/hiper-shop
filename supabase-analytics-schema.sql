-- HiPeR Analytics Schema for Supabase
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Analytics Events Table
-- Stores all user events (page views, artwork views, cart adds, etc.)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  artwork_id TEXT,
  artwork_title TEXT,
  order_id TEXT,
  size_name TEXT,
  frame_name TEXT,
  price NUMERIC,
  item_count INTEGER,
  page TEXT,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Sales Table
-- Stores individual item sales for detailed reporting
CREATE TABLE IF NOT EXISTS analytics_sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL,
  artwork_id TEXT NOT NULL,
  artwork_title TEXT,
  size_name TEXT,
  frame_name TEXT,
  price NUMERIC,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sales_order ON analytics_sales(order_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sales_artwork ON analytics_sales(artwork_id);

-- Enable Row Level Security (RLS)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sales ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert events (for tracking anonymous users too)
CREATE POLICY "Anyone can insert analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can insert analytics sales" ON analytics_sales
  FOR INSERT WITH CHECK (true);

-- Policy: Only admin can read all analytics
-- Replace 'hiper.6258@gmail.com' with your admin email if different
CREATE POLICY "Admin can read all analytics events" ON analytics_events
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'hiper.6258@gmail.com'
  );

CREATE POLICY "Admin can read all analytics sales" ON analytics_sales
  FOR SELECT USING (
    auth.jwt() ->> 'email' = 'hiper.6258@gmail.com'
  );

-- Grant permissions
GRANT INSERT ON analytics_events TO anon, authenticated;
GRANT INSERT ON analytics_sales TO anon, authenticated;
GRANT SELECT ON analytics_events TO authenticated;
GRANT SELECT ON analytics_sales TO authenticated;
