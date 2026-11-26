# CALLBACX MARKETING Website

Premium influencer marketing agency website.

## What CALLBACX MARKETING is

CALLBACX MARKETING is an influencer marketing agency, **not a marketplace**. Our team finds brands, finds influencers, negotiates deals, and manages campaigns by email. Brands and influencers do not have dashboards, do not log in, and do not discover each other on the website — they contact us and we manage everything.

## Public pages (only)

- Home — `/`
- Services — `/services`
- For Brands — `/for-brands`
- For Influencers — `/for-influencers`
- About Us — `/about`
- Contact Us — `/contact`
- Privacy Policy — `/privacy-policy`
- Terms — `/terms-and-conditions`

No public registration. No public login. No member dashboards.

## Stack

- Next.js (App Router) + TypeScript (strict)
- Tailwind CSS
- Lucide icons

## Setup

1. `npm install`
2. `npm run dev`
3. `npm run build -- --webpack` to verify the production build.

## Architecture

- `src/app` routes — the 8 public pages above only
- `src/components/ui` reusable UI primitives (Button, Card, SectionTitle, Input, icons)
- `src/components/layout` shared SiteHeader, SiteFooter, and navigation config
- `src/components/sections/PageHero` reusable page hero
- `src/app/globals.css` design tokens (colors, typography, spacing, shadows, animations)
- `src/lib/utils` helpers (`cn`)

## Design tokens

Defined in `src/app/globals.css` as CSS variables (colors, spacing, radii, shadows, typography).

## Mobile-first

Responsive Tailwind breakpoints throughout.
