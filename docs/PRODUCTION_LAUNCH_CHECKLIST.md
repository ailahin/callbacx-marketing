# CALLBACX TECHNOLOGY — Production Launch Checklist

Last updated: 2026-11-22. Status legend: `[x]` done, `[ ]` outstanding, `[~]` partial/needs verification. Do not claim production readiness until all items are checked.

## 1. Deployment (Next.js + Vercel)

- [~] Vercel project linked; build command `npm run build`; Node 20+.
- [ ] Preview deployments for PRs; production branch = `main`.
- [ ] `typescript.ignoreBuildErrors` set to false before release (currently `true` in `next.config.ts`).
- [ ] `NEXT_PUBLIC_APP_URL` set to production HTTPS URL in Vercel env.
- [ ] Custom domain configured + HTTPS enforced (HSTS).
- [ ] Redirect www ↔ apex decided.
- [ ] `vercel.json` (if needed) for headers/CSP.

## 2. Supabase (production)

- [ ] Production Supabase project created; separate from dev/staging.
- [ ] `supabase link --project-ref <prod>` recorded.
- [ ] Migrations applied via `supabase db push` (never `db reset` in prod).
- [ ] RLS verified (`supabase/tests/rls.sql`) against prod snapshot.
- [ ] Storage buckets/policies verified (`0014_storage.sql`).
- [ ] Backups enabled (daily) + PITR if available.
- [ ] Service role key stored only in Vercel (server-side).

## 3. Environments

- [ ] dev / staging / prod env files documented.
- [ ] `.env.local` never committed; secrets in Vercel + Supabase.
- [ ] `INTEGRATION_VAULT_KEY` generated (32 bytes base64) for prod.
- [ ] Stripe live keys only after verification (`STRIPE_LIVE_MODE=false` until E2E pass).

## 4. Database migrations safety

- [ ] All migrations reviewed; no destructive changes in prod.
- [ ] `supabase db push` dry-run on staging first.
- [ ] Backup taken immediately before prod migration.

## 5. Transactional email

- [ ] Resend account + domain verified (SPF/DKIM/DMARC).
- [ ] `RESEND_API_KEY`, `RESEND_FROM_EMAIL` set.
- [ ] Templates tested (signup, reset password, notifications).

## 6. Monitoring

- [ ] Error monitoring (Sentry or equivalent) wired into Next.js.
- [ ] Server logs aggregation.
- [ ] Supabase DB performance monitoring + slow query alerts.
- [ ] API failure monitoring / uptime (Vercel Analytics or external).
- [ ] Uptime monitor on `/` and key API routes.
- [ ] Stripe webhook monitoring + retry handling.
- [ ] Admin activity log review cadence.

## 7. Mobile (PWA + Expo prep)

- [ ] PWA manifest covers whole app (currently admin-only `id: callbacx-admin`, start_url `/dashboard/admin`). Expand for brand/creator apps or create separate manifest.
- [ ] Replace SVG icons with PNG (192/512) for iOS installability; add `apple-touch-icon.png`.
- [ ] Splash screens / theme color.
- [ ] Offline behaviour review (`public/sw.js`, `offline.html`) — currently caches admin shell only.
- [ ] API services independent of web UI (services layer exists under `src/services` and `src/services/database`).
- [ ] Shared API contracts + TypeScript types exported for Expo (`src/lib/supabase/types/database.ts`).
- [ ] Document Android/iOS dev requirements (Android Studio, Xcode, EAS).

## 8. Legal & trust

- [ ] Privacy policy reviewed (`src/app/privacy-policy`).
- [ ] Terms reviewed (`src/app/terms-and-conditions`).
- [ ] Cookie consent banner where required (not present — implement).
- [ ] GDPR data access + deletion workflows (account deletion not implemented — implement).
- [ ] Data retention + subprocessors documented.
- [ ] Accessibility (WCAG 2.1 AA) audit.

## 9. Outstanding legal/security/integration/operational requirements

- Legal: cookie consent, account deletion, data export, retention policy doc.
- Security: CSP headers, rotate dev credentials, remove `ignoreBuildErrors`, secrets audit (see `QA_SECURITY_AUDIT_REPORT.md` findings 7 config + 4 code).
- Integration: Stripe live mode pending; social platform OAuth pending; email provider pending.
- Operational: monitoring, backups, runbook, on-call.

## 10. Go/No-Go gate

Production deployment is NOT approved until sections 1–9 are complete and verified. Dev credentials must not be exposed.
