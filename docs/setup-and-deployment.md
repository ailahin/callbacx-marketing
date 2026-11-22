# CALLBACX MARKETING — Database Setup & Deployment

This guide takes the Supabase database from zero to a running local stack, and
then to a hosted Supabase project. The Next.js app and the future Expo app share
this backend.

---

## 1. Prerequisites

- Node.js 20+ and npm
- Supabase CLI 2.x (`npx supabase --version`)
- Docker (required for local Supabase stack)
- A Supabase project (hosted) for deployment

---

## 2. Local development

### 2.1 Install dependencies
```bash
npm install
```

### 2.2 Start the local Supabase stack
```bash
npx supabase start
```
This boots Postgres, Auth, Storage, Realtime, and the API gateway in Docker.

### 2.3 Apply migrations
Migrations run automatically on `supabase start`. To reset to a clean state and
re-apply everything (including `seed.sql`):
```bash
npx supabase db reset
```

### 2.4 (Optional) Seed sample data
`seed.sql` inserts reference data (roles, permissions, categories, settings,
feature flags) unconditionally, and user-bound data (profiles, brands, creators,
campaigns) **only if the corresponding `auth.users` rows exist**. Create the demo
auth users via the Supabase Auth signup flow (or the Admin API) before re-seeding
if you want the sample brand/creator data.

### 2.5 Environment variables
Copy `.env.local.example` to `.env.local` and fill:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```
Get the keys with `npx supabase status`.

### 2.6 Run the app
```bash
npm run dev
```

---

## 3. Verification (before any deployment)

### 3.1 Structural + constraint + storage checks
```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -f supabase/tests/verify.sql
```
(or `supabase db reset` then run the file via psql). A non-zero exit / raised
exception means a migration or constraint is broken.

### 3.2 RLS isolation tests
```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -f supabase/tests/rls.sql
```
This creates throwaway auth users and impersonates each role to assert:
cross-brand isolation, creator data isolation, anon vs published campaign
visibility, duplicate-application blocking, privileged-role self-assignment
blocking, payment-record restriction, and conversation participant gating.

---

## 4. Generating TypeScript types

After changing the schema (or on a fresh clone), regenerate the authoritative types:
```bash
npx supabase gen types typescript --linked > src/lib/supabase/types/database.ts
```
Then re-apply the convenience aliases (`Row`/`Insert`/`Update`) if needed. The
current file is hand-maintained to mirror `0001..0014`; keep it in sync with
migrations.

Validate the generated types compile:
```bash
npx tsc --noEmit
```

---

## 5. Deploying to a hosted Supabase project

### 5.1 Link the project
```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

### 5.2 Apply migrations (non-destructive)
```bash
npx supabase db push
```
This applies pending migrations to the linked project. It never runs destructive
migrations without confirmation. **Do not run `db reset` against production.**

### 5.3 Seed production (optional, reference data only)
`seed.sql`'s user-bound section is a no-op without matching `auth.users`, so it is
safe to run for reference data. To insert reference data only, run:
```bash
psql "$DATABASE_URL" -f supabase/seed.sql
```
(`$DATABASE_URL` from the Supabase dashboard). Review before running.

### 5.4 Storage
Buckets and object policies are created by migration `0014_storage.sql`, applied by
`supabase db push`. Verify in the dashboard under **Storage** that the buckets exist
with the expected public/private flags.

---

## 6. External integrations (pending configuration)

These are documented interfaces; credentials are **not** in the repo.

### 6.1 Social platform metrics (Instagram, TikTok, YouTube, ...)
- `creator_social_accounts.metrics_source` is `manual` or `platform_api`.
- When a platform API is connected, a **server-side** job updates
  `followers_count`, `engagement_rate`, and inserts a
  `social_metrics_snapshots` row (source = `platform_api`).
- OAuth tokens live in a secrets vault (e.g. Supabase Vault / a KMS), never in the
  database. Mark as pending until credentials are provisioned.

### 6.2 Payments (Stripe or other)
- `payment_transactions.provider` abstracts the provider.
- Webhooks post to a server endpoint that inserts into
  `payment_webhook_events (provider, event_id)` (idempotent).
- Only after verifying the provider signature server-side does the app set
  `payment_transactions.status = 'succeeded'` (requires `provider_payment_id`).
- No card data / CVVs are stored. Mark as pending until provider keys are set.

---

## 7. Operational notes

- **Backups**: enable Supabase daily backups; audit/payment tables are append-only
  and must be retained for compliance.
- **Retention**: soft-deleted user rows can be hard-deleted by an admin job;
  analytics and audit rows are retained indefinitely.
- **RLS changes**: every new table must enable RLS and have explicit policies.
  Do not add broad `using (true)` write policies.
- **Indexes**: verify with `EXPLAIN` on common queries; the composite indexes in
  `0013` cover the primary access patterns.

---

## 8. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `supabase start` fails | Docker not running |
| Empty data after reset | auth users not created → seed skipped user-bound rows |
| `getSupabaseAdminClient()` throws | called from client code; move to server |
| RLS test fails | a migration didn't apply; re-run `supabase db reset` |
| Type errors after gen | run `npx tsc --noEmit`; re-apply aliases |