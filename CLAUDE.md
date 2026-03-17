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
- **Search** — full-text search across title, artist, style, description, category, series name
- **Favorites** — star artworks from any view; persisted to localStorage; filterable via chip
- **Category filter chips** — 9 categories + All Works + Favorites chip in filter bar
- **Demo mode** — amber banner + demo notice in auth modal; all artworks visible (no 3-item limit); any email/password accepted; uploads persist to localStorage
- **Landing page** — hero on first visit (localStorage flag); skipped on return
- Shop: Stripe checkout, Prodigi print-on-demand, order history, shop-specific overrides
- Supabase RLS policies correctly restrict write operations

### What's broken / needs attention ✗
1. **`gallery/src/hooks/useAuth.js`** — dead code. Not imported by App.jsx (which has inline auth). Kept for reference but unused.
2. **`gallery/src/components/AuthModal.jsx`** — dead code. App.jsx has its own inline auth modal.
3. **Bundle size** — both apps bundle as a single ~870-760KB JS chunk. No code splitting.
4. **`VITE_ANTHROPIC_API_KEY` exposed client-side** — intentional (`anthropic-dangerous-direct-browser-access` header) but a scoped key with spending limits is essential.
5. **Admin email hardcoded** — `hiper.6258@gmail.com` hardcoded in App.jsx AND Supabase RLS policies.
6. **Root `src/` directory** — orphaned copy of the shop app; not deployed, just noise.

### prompt-repository relationship
`~/projects/tools/prompt-repository` was a fork of the gallery. The search feature has been merged back into HiPeR gallery (March 2026). The repos are now in sync — no more divergence to track.

### MVP status
- Gallery: production-live, fully functional with search/filter/favorites/demo mode
- Shop: production-live with real Stripe + Prodigi integration
- Main gaps: developer experience (monolithic files, no TS) and performance (bundle size)

### Next priorities (if continuing development)
1. Move Anthropic key server-side (Vercel function) — avoid client-side key exposure
2. Split App.jsx into feature components (upload modal, gallery grid, admin panel)
3. Delete root-level `src/` directory (orphaned shop copy)
4. Add search feature to shop app (currently gallery-only)
