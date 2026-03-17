# HiPeR — AI Art Gallery + Print Shop

## Project Scope
Dual-application art platform:
- **Gallery** (`gallery/`): Public-facing curated art gallery for browsing/uploading artworks
- **Shop** (`shop/`): E-commerce for selling prints via Prodigi print-on-demand

Both apps are production-live on Vercel.

## Tech Stack
- React 19 / Vite 7
- Tailwind CSS 4
- Supabase (auth, database, storage)
- Stripe (payments — shop only)
- Prodigi API (print-on-demand)
- dnd-kit (drag-and-drop)
- Lucide React (icons)

## Architecture
```
HiPeR/
├── gallery/                ← Main gallery app
│   ├── src/App.jsx         ← Core gallery logic (~5270 lines, monolithic)
│   ├── src/components/     ← AuthModal, LandingPage
│   ├── src/hooks/          ← useAuth.js (not used by App.jsx — standalone)
│   └── src/services/       ← auth, database, analytics, prodigi, ai
├── shop/                   ← E-commerce app
│   ├── src/App.jsx         ← Shop logic (~6540 lines, monolithic)
│   ├── src/services/       ← auth, database, analytics, prodigi, ai
│   └── api/                ← Vercel serverless functions (Stripe, Prodigi)
├── assets/                 ← Shared PNG assets
├── backups/                ← JSON artwork backups
└── supabase-*.sql          ← Database schema files (canonical at root)
```

## Quick Start
```bash
# Gallery (http://localhost:5173)
cd gallery && npm install && npm run dev

# Shop (http://localhost:5174 or next available port)
cd shop && npm install && npm run dev
```

## Live URLs
- Gallery: https://prompt-repository-orcin.vercel.app
- Shop: https://hiper-shop.vercel.app

## Environment Variables

### Gallery (`gallery/.env.local`)
```
VITE_SUPABASE_URL         # Supabase project URL
VITE_SUPABASE_ANON_KEY    # Supabase anon key
VITE_ANTHROPIC_API_KEY    # Optional — enables AI artwork descriptions
```
**Warning:** `VITE_ANTHROPIC_API_KEY` is bundled into the browser build. Use a scoped key with spending limits.

### Shop (`shop/.env.local`)
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_STRIPE_PUBLIC_KEY
STRIPE_SECRET_KEY          # Server-side only (Vercel functions)
STRIPE_WEBHOOK_SECRET      # Server-side only
PRODIGI_API_KEY            # Server-side only
```

## Database (Supabase)
- Gallery writes to `artworks` table
- Shop reads via `shop_artworks` view (combines `artworks` + optional `shop_overrides`)
- Schema files: `supabase-schema.sql` (core), `supabase-analytics-schema.sql`, `supabase-orders-schema.sql`, `supabase-shop-sync-schema.sql`

### Key Tables
| Table | Owner | Purpose |
|-------|-------|---------|
| `artworks` | gallery | All artwork records |
| `profiles` | shared | User profiles (auto-created via trigger) |
| `shop_overrides` | shop | Per-artwork title/description/price overrides |
| `orders` | shop | Stripe + Prodigi order tracking |
| `analytics_events` | shared | Page views, artwork views, favorites |
| `analytics_sales` | shop | Per-item sale records |

## GitHub
- Repo: `yuda420-dev/hiper-shop`
- Push requires: `gh auth switch --user yuda420-dev`

## Cross-Project Reference
- Shared patterns: `~/orginize/knowledge/patterns.md`
- Master registry: `~/orginize/CLAUDE.md`

---

## Honest Assessment (March 2026)

### What works ✓
- Both apps build and deploy cleanly to Vercel
- Gallery: full artwork upload, series grouping, drag-and-drop curation, category filter, favorites, AI descriptions via Claude Vision
- Shop: Stripe checkout, Prodigi print-on-demand, order history, shop-specific overrides
- Supabase RLS policies correctly restrict write operations
- Demo mode works without Supabase configured (shows default artworks)
- Landing page on first visit (gallery only)

### What's broken / needs attention ✗
1. **`gallery/src/hooks/useAuth.js`** — not imported by App.jsx. App.jsx has its own inline auth. useAuth.js is a dead hook.
2. **`gallery/src/services/database.js`** — rewritten to correct HiPeR functions; previously had wrong tables (bookings, community_posts etc. from a different project template).
3. **Bundle size** — both apps bundle as a single ~700-870KB JS chunk. No code splitting. This causes slow initial loads.
4. **`VITE_ANTHROPIC_API_KEY` exposed client-side** — intentional (uses `anthropic-dangerous-direct-browser-access` header) but risky. Consider proxying through a Vercel function.
5. **Admin email hardcoded** — `hiper.6258@gmail.com` is hardcoded in App.jsx AND RLS policies. Moving users between accounts requires updating both.
6. **Root `src/` directory** — is an orphaned copy of the shop app from before the monorepo reorganization. Not deployed, just noise.

### MVP status
- Gallery is functional and production-live
- Shop is functional and production-live with real Stripe + Prodigi integration
- Main gaps are developer experience (no TS, monolithic files) and performance (bundle size)

### Next priorities (if continuing development)
1. Split App.jsx into feature components (auth, upload modal, gallery grid, admin panel, etc.)
2. Move Anthropic key to a Vercel serverless function to avoid client-side exposure
3. Add the search feature from `~/projects/tools/prompt-repository` to gallery (it's 1 commit ahead with search query filtering)
4. Delete root-level `src/` directory (orphaned shop copy)
