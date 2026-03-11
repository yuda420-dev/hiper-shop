-- HiPeR Shop Sync Schema for Supabase
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This creates the one-way sync from Gallery to Shop

-- ============================================
-- 1. Shop Overrides Table
-- ============================================
-- Stores shop-specific settings for each artwork
-- NULL values mean "use the Gallery value"

CREATE TABLE IF NOT EXISTS shop_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,

  -- Override fields (NULL = use gallery value)
  shop_title TEXT,
  shop_description TEXT,
  base_price DECIMAL(10,2) DEFAULT 299,

  -- Shop-only fields
  in_shop BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  available_sizes JSONB DEFAULT '["12x12","18x18","24x24","36x36","48x48"]',
  available_frames JSONB DEFAULT '["canvas","black","white","oak","walnut","gold"]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(artwork_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_shop_overrides_artwork ON shop_overrides(artwork_id);
CREATE INDEX IF NOT EXISTS idx_shop_overrides_in_shop ON shop_overrides(in_shop);
CREATE INDEX IF NOT EXISTS idx_shop_overrides_featured ON shop_overrides(featured);

-- Enable Row Level Security
ALTER TABLE shop_overrides ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read shop overrides
CREATE POLICY "Anyone can read shop overrides" ON shop_overrides
  FOR SELECT USING (true);

-- Policy: Admin can manage shop overrides
CREATE POLICY "Admin can manage shop overrides" ON shop_overrides
  FOR ALL USING (
    auth.jwt() ->> 'email' = 'hiper.6258@gmail.com'
  );

-- Grant permissions
GRANT SELECT ON shop_overrides TO anon, authenticated;
GRANT ALL ON shop_overrides TO service_role;

-- ============================================
-- 2. Auto-sync Trigger
-- ============================================
-- When artwork is added to Gallery, auto-create shop_overrides row

CREATE OR REPLACE FUNCTION create_shop_override()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO shop_overrides (artwork_id)
  VALUES (NEW.id)
  ON CONFLICT (artwork_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS artwork_to_shop ON artworks;

-- Create trigger
CREATE TRIGGER artwork_to_shop
AFTER INSERT ON artworks
FOR EACH ROW
EXECUTE FUNCTION create_shop_override();

-- ============================================
-- 3. Backfill Existing Artworks
-- ============================================
-- Create shop_overrides for any existing artworks

INSERT INTO shop_overrides (artwork_id)
SELECT id FROM artworks
ON CONFLICT (artwork_id) DO NOTHING;

-- ============================================
-- 4. Update orders table to link to user
-- ============================================
-- Add user_id column if not exists (for order history)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES auth.users(id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  END IF;
END $$;

-- ============================================
-- 5. Helpful Views
-- ============================================

-- View for shop artworks with overrides merged
-- IMPORTANT: Must include series_name, user_id, is_default for proper grouping
CREATE OR REPLACE VIEW shop_artworks AS
SELECT
  a.id,
  a.image_url,
  a.artist,
  a.category,
  a.series_name,
  a.user_id,
  a.is_default,
  COALESCE(so.shop_title, a.title) as title,
  COALESCE(so.shop_description, a.description) as description,
  COALESCE(so.base_price, 299) as base_price,
  COALESCE(so.in_shop, true) as in_shop,
  COALESCE(so.featured, false) as featured,
  COALESCE(so.available_sizes, '["12x12","18x18","24x24","36x36","48x48"]'::jsonb) as available_sizes,
  COALESCE(so.available_frames, '["canvas","black","white","oak","walnut","gold"]'::jsonb) as available_frames,
  a.is_public,
  a.created_at,
  so.updated_at as shop_updated_at
FROM artworks a
LEFT JOIN shop_overrides so ON a.id = so.artwork_id
WHERE a.is_public = true;

-- Grant access to the view
GRANT SELECT ON shop_artworks TO anon, authenticated;

-- ============================================
-- Done!
-- ============================================
-- The sync is now set up:
-- 1. New artworks in Gallery auto-create shop_overrides
-- 2. Shop reads from shop_artworks view (merged data)
-- 3. Shop admin can update shop_overrides only
-- 4. Gallery data never modified by Shop
