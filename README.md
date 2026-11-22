# CALLBACX TECHNOLOGY Web Platform

Premium influencer marketing and creator partnership platform.

## Stack
- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS
- Supabase (auth, Postgres, storage)
- Lucide icons

## Setup
1. Copy `.env.local.example` to `.env.local` and fill Supabase values.
2. `npm install`
3. `npm run dev` (use `--webpack` on Windows if Turbopack native bindings unavailable)
4. `npm run build -- --webpack` to verify production build.

## Architecture
- `src/app` routes
- `src/components/ui` reusable UI
- `src/components/layout` layout primitives
- `src/features/*` feature modules
- `src/layouts` public/brand/creator/admin layouts
- `src/services` API/business logic (UI-independent)
- `src/hooks` shared hooks
- `src/types` shared types
- `src/utils` helpers
- `src/config` env + constants
- `src/lib/supabase` Supabase clients

## Design tokens
Defined in `src/app/globals.css` as CSS variables (colors, spacing, radii, shadows, typography).

## Mobile-first
Responsive Tailwind breakpoints; architecture prepared for future React Native/Expo via shared services/hooks/types.


