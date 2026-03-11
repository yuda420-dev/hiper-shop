# HiPeR Project Status & Technical Documentation

**Last Updated:** January 4, 2026
**Status:** Production (Live)

---

## Quick Links

| Resource | URL |
|----------|-----|
| **Gallery (Public)** | https://prompt-repository-orcin.vercel.app |
| **Shop (E-commerce)** | https://hiper-shop.vercel.app |
| **Gallery GitHub** | https://github.com/yuda420-dev/prompt-repository |
| **Shop GitHub** | https://github.com/yuda420-dev/hiper-shop |

---

## Project Structure

```
/Users/ygoodman/Downloads/HiPeR/
├── gallery/          # Main gallery app (prompt-repository)
│   └── src/App.jsx   # Main React component (~5000 lines)
├── shop/             # E-commerce shop with Stripe + Prodigi
│   └── src/App.jsx   # Main React component (~6500 lines)
├── assets/           # Shared assets (PNG files, etc.)
├── backups/          # JSON backups of artwork data
└── HIPER-PROJECT-STATUS.md  # This file
```

---

## Architecture Overview

### Gallery (prompt-repository)
- **Purpose:** Curated art gallery for browsing and uploading artworks
- **Tech Stack:** React + Vite, Tailwind CSS, Supabase (auth + storage + database)
- **Features:**
  - User authentication (email + Google sign-in)
  - Series/folder grouping for artworks
  - Drag-and-drop reordering (admin only)
  - Category filtering and sorting (newest, oldest, title, curated)
  - Favorites system
  - Export/Import functionality for backups

### Shop (hiper-shop)
- **Purpose:** E-commerce platform for selling prints
- **Tech Stack:** React + Vite, Tailwind CSS, Supabase, Stripe, Prodigi API
- **Features:**
  - One-way sync from Gallery (reads from `shop_artworks` view)
  - Custom titles/descriptions for shop (via `shop_overrides` table)
  - Shopping cart with Stripe Checkout
  - Prodigi print-on-demand integration
  - Order history tracking

### Database (Supabase)
- **Tables:**
  - `artworks` - Main artwork storage (Gallery writes, Shop reads)
  - `shop_overrides` - Shop-specific title/description overrides
  - `orders` - Order tracking for purchases
  - `user_roles` - Admin role management

- **Views:**
  - `shop_artworks` - Combines artworks + shop_overrides for Shop display

---

## Recent Session Summary (January 4, 2026)

### Issues Fixed Today

1. **Series Regression After Gallery→Shop Sync**
   - BUG: Gallery upload couldn't upload series (only individual artworks)
   - BUG: Shop displayed individual artworks instead of grouped series
   - FIX: Updated `shop_artworks` SQL view to include `series_name`, `user_id`, `is_default` columns

2. **iPad/Touch Device UX Improvements**
   - Added `TouchSensor` with 150ms delay for drag-and-drop
   - Made series thumbnails larger (80x80px) for easier touch targets
   - Improved visual feedback during drag operations

3. **Sorting Bug (Critical)**
   - BUG: Sorting by "newest" showed wrong items, "oldest" missing new uploads
   - ROOT CAUSE: Code used `Math.max(...ids)` treating UUIDs as numbers (UUIDs are strings!)
   - FIX: Added `createdAt` field mapped from `created_at` database column
   - FIX: Use `localeCompare()` for string date comparison instead of numeric

4. **Gallery White Screen Crash**
   - BUG: When sorting by "newest", entire page went white/blank
   - ROOT CAUSE: `localeCompare()` called on undefined values; modulo-by-zero in empty series
   - FIX: Added try-catch and `String()` coercion to sorting logic
   - FIX: Protected series card rendering against empty artwork arrays
   - FIX: Added "No artworks" placeholder for empty series

### File Organization
- Moved `prompt-repository` → `HiPeR/gallery`
- Moved `hiper-shop` → `HiPeR/shop`
- Organized assets and backups into dedicated folders

---

## Key Code Locations

### Gallery (App.jsx)
| Feature | Lines (approx) |
|---------|----------------|
| Artwork loading from Supabase | 850-910 |
| Series grouping logic | 1215-1280 |
| Sorting logic (newest/oldest/title) | 1239-1280 |
| Series card rendering | 2340-2460 |
| Upload flow | 910-1000 |

### Shop (App.jsx)
| Feature | Lines (approx) |
|---------|----------------|
| Artwork loading from shop_artworks view | 850-950 |
| Series grouping logic | 1530-1600 |
| Sorting logic | 1560-1600 |
| Stripe checkout | 1100-1200 |
| Prodigi integration | 1200-1350 |

---

## Database Schema Reference

### artworks table
```sql
id uuid PRIMARY KEY
title text
artist text
category text
description text
image_url text
series_name text          -- Groups artworks into series
user_id uuid              -- Owner of the artwork
is_default boolean        -- True for pre-seeded gallery items
is_public boolean         -- Visibility flag
created_at timestamp
```

### shop_artworks view
```sql
CREATE OR REPLACE VIEW shop_artworks AS
SELECT
  a.id, a.image_url, a.artist, a.category,
  a.series_name, a.user_id, a.is_default,
  COALESCE(so.shop_title, a.title) as title,
  COALESCE(so.shop_description, a.description) as description,
  so.shop_price as price,
  a.created_at
FROM artworks a
LEFT JOIN shop_overrides so ON a.id = so.artwork_id
WHERE a.is_public = true;
```

---

## Environment Variables

### Gallery (Vercel)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Shop (Vercel)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `PRODIGI_API_KEY`

---

## Common Operations

### Starting Fresh with Claude Code CLI
When starting a new session, provide this context:
```
Working on HiPeR project:
- Gallery: ~/Downloads/HiPeR/gallery (deployed to prompt-repository-orcin.vercel.app)
- Shop: ~/Downloads/HiPeR/shop (deployed to hiper-shop.vercel.app)
- Both use Supabase for backend
- Shop has Stripe + Prodigi integration
```

### Deploying Changes
```bash
# Gallery
cd ~/Downloads/HiPeR/gallery
npm run build
npx vercel --prod

# Shop
cd ~/Downloads/HiPeR/shop
npm run build
npx vercel --prod
```

### Git Workflow
```bash
# Gallery
cd ~/Downloads/HiPeR/gallery
git add -A && git commit -m "description" && git push

# Shop
cd ~/Downloads/HiPeR/shop
git add -A && git commit -m "description" && git push
```

---

## Known Issues / Future Work

1. **Bundle Size Warning** - Both apps exceed 500KB chunk size. Consider code-splitting.
2. **Touch Optimization** - Drag-and-drop works on iPad but could be smoother
3. **Offline Support** - Currently requires internet; could add PWA features

---

## Contact & Support

For questions or to continue development, share this document with Claude Code CLI or Claude Chat to provide full context.
