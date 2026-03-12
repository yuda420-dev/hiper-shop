# HiPeR — AI Art Gallery + Print Shop

## Project Scope
Dual-application art platform:
- **Gallery** (prompt-repository): Public-facing curated art gallery for browsing/uploading artworks
- **Shop** (hiper-shop): E-commerce for selling prints via Prodigi print-on-demand

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
│   ├── src/App.jsx        ← Core gallery logic (~5000 lines)
│   ├── src/components/    ← AuthModal + reusable components
│   └── src/services/      ← auth, database, analytics, prodigi, ai
├── shop/                  ← E-commerce app
│   ├── src/App.jsx        ← Shop logic (~6500 lines)
│   ├── src/services/      ← Same service layer
│   └── api/               ← Vercel serverless functions
├── assets/                ← Shared PNG assets
└── backups/               ← JSON artwork backups
```

## Quick Start
```bash
# Gallery
cd gallery && npm install && npm run dev

# Shop
cd shop && npm install && npm run dev
```

## Live URLs
- Gallery: https://prompt-repository-orcin.vercel.app
- Shop: https://hiper-shop.vercel.app

## Database
- Gallery writes to `artworks` table
- Shop reads via `shop_artworks` view (with optional `shop_overrides`)

## Secrets (DO NOT COMMIT)
- gallery/.env.local — Supabase keys
- shop/.env.local — Supabase + Stripe + Prodigi keys
- Backups at ~/orginize/.env-backups/

## Cross-Project Reference
- Shared patterns: ~/orginize/knowledge/patterns.md
- Master registry: ~/orginize/CLAUDE.md

## GitHub
- Repo: yuda420-dev/hiper-shop
- Push requires: `gh auth switch --user yuda420-dev`
