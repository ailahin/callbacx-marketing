# CALLBACX MARKETING — Local Development Performance Diagnosis

**Date**: 2026-11-22
**Environment**: Next.js 16.4.6, React 19.3.0, Node.js 24.18.0, npm 10.7.0
**Package Manager**: npm (package-lock.json v3)

---

## Executive Summary

The Callbacx Marketing application exhibits **severely degraded local development performance** with initial page compilation times of **37–51 seconds** and dev server startup of ~9.3 seconds. The primary bottlenecks are:

1. **Next.js development compilation overhead** (webpack-based, not Turbopack)
2. **Middleware executing expensive Supabase queries on every request**
3. **AuthProvider fetching user profile data on every auth state change**
4. **Per-page data fetching in useEffect with no request deduplication**
5. **Configuration issues causing warnings and recompilation**

---

## 1. Environment Analysis

### Versions
| Component | Version | Status |
|-----------|---------|--------|
| Next.js | 16.4.6 | Current |
| React | 19.3.0 | Current |
| Node.js | 24.18.0 | Current (even version) |
| npm | 10.7.0 | Current |
| TypeScript | ^5 | Current |
| Tailwind CSS | 4.3.3 | Current |

### Package Manager
- **npm** with `package-lock.json` (lockfileVersion 3)
- 22 production dependencies, 9 dev dependencies
- No duplicate dependencies detected

### Configuration Files
- `next.config.ts` — Minimal config with **invalid experimental.turbo option**
- `tsconfig.json` — Standard Next.js config with path aliases
- `.env.local` — Configured with remote Supabase project (not local)
- `middleware.ts` — **Deprecated middleware convention** (should use proxy)

---

## 2. Measured Performance Metrics

### Dev Server Startup
| Metric | Value | Target |
|--------|-------|--------|
| Ready time | **9.3s** | < 3s |
| Next.js config execution | 381ms | < 100ms |
| Turbopack | **Disabled** (invalid config) | Enabled |

### Page Compilation Times (First Load)
| Route | Compilation Time | Notes |
|-------|------------------|-------|
| `/` (Homepage) | **~37s** | 8 sections, 7 images |
| `/login` | ~8s | Form validation errors |
| `/demo` | **~51s** | Multiple form errors |
| `/services` | ~29s | Static page |
| `/page` (recompile) | ~17s | HMR update |

### Page Re-compilation (HMR)
| Route | Time | Trigger |
|-------|------|---------|
| `/demo` | ~3s | Hot reload |
| `/login` | ~6s | Navigation |

### Build Performance (Production)
| Metric | Value |
|--------|-------|
| Compile time | 9.7s |
| Static generation (79 pages) | 5.0s |
| Total build | ~15s |
| Static bundle size | 2.2 MB |
| Largest JS chunk | 262 KB |

### Network & Supabase
| Metric | Value |
|--------|-------|
| Supabase URL | `https://lozooypsjkbuceeolybo.supabase.co` (remote) |
| Demo mode | Enabled (`NEXT_PUBLIC_DEMO_MODE=true`) |
| Middleware Supabase calls/request | 1–6 queries |
| AuthProvider queries/auth change | 4 parallel queries |

---

## 3. Identified Issues

### 🔴 CONFIRMED PROBLEMS (High Severity)

#### Issue 1: Next.js Development Compilation Extremely Slow
- **Description**: First page compilation takes 37–51 seconds
- **Evidence**: Dev server logs show `Compiling /page ...` at 00:01:22, warning at 00:01:59
- **Affected**: All pages, especially homepage and dashboard routes
- **Severity**: **Critical**
- **Root Cause**: 
  - Webpack (not Turbopack) due to invalid `experimental.turbo` config
  - Large component tree on homepage (8 sections + header/footer)
  - No `metadataBase` causing repeated warnings
  - Multiple `use client` boundaries forcing client-side compilation
- **Recommended Fix**:
  1. Fix `next.config.ts` — remove invalid `experimental: { turbo: false }` or enable properly
  2. Add `metadataBase` to root layout metadata
  3. Consider splitting homepage sections into separate chunks with `next/dynamic`
- **Expected Impact**: 60–80% reduction in first compilation time

#### Issue 2: Middleware Executes Expensive Supabase Queries on Every Request
- **Description**: Middleware runs on all non-static routes and makes 1–6 Supabase queries per request
- **Evidence**: `middleware.ts` lines 91–146: `getSession()` + profile + roles + brand_member + creator_profile queries
- **Affected**: All dashboard routes (`/dashboard/*`), login, registration
- **Severity**: **Critical**
- **Root Cause**:
  - Middleware matcher catches all routes except static assets
  - No request-scoped caching of auth results
  - Sequential queries instead of parallel
  - Runs on every navigation (including client-side transitions)
- **Recommended Fix**:
  1. Narrow matcher to only `/dashboard/:path*`
  2. Implement request-scoped caching (already has WeakMap pattern in client.ts)
  3. Run queries in parallel with `Promise.all`
  4. Consider moving role checks to server components
- **Expected Impact**: 50–70% reduction in dashboard navigation latency

#### Issue 3: AuthProvider Fetches Full User Profile on Every Auth State Change
- **Description**: `AuthProvider.tsx` lines 170–255 runs 4 parallel Supabase queries on every session change
- **Evidence**: `fetchUserProfile` called from `useEffect` (line 285) and `onAuthStateChange` (line 302)
- **Affected**: All pages using `useAuth()` — essentially entire app
- **Severity**: **High**
- **Root Cause**:
  - No memoization of profile data across renders
  - `fetchUserProfile` has empty dependency array but called from effect with `refreshSession` dependency
  - Demo mode short-circuits but production would hit Supabase repeatedly
- **Recommended Fix**:
  1. Add request-scoped cache for profile (similar to `getCachedProfileId` in client.ts)
  2. Only refetch when user ID actually changes
  3. Consider moving profile fetch to server component for initial load
- **Expected Impact**: Eliminate redundant auth queries on navigation

#### Issue 4: Per-Page Data Fetching with No Request Deduplication
- **Description**: Every dashboard page has its own `useEffect` fetching data independently
- **Evidence**: 61 `useEffect` hooks across codebase; each dashboard page (brand/creator/admin overview, campaigns, etc.) has identical pattern
- **Affected**: All 30+ dashboard pages
- **Severity**: **High**
- **Root Cause**:
  - No shared data fetching layer (React Query, SWR, or custom)
  - Each component manages own loading/error/state
  - Filters trigger re-fetches without debouncing
- **Recommended Fix**:
  1. Introduce React Query or SWR for server state management
  2. Create shared hooks for common queries (`useCampaigns`, `useCollaborations`, etc.)
  3. Implement request deduplication and caching
- **Expected Impact**: 40–60% reduction in dashboard data loading; better UX with stale-while-revalidate

#### Issue 5: Next.js 15 Breaking Change — `searchParams` is a Promise
- **Description**: `/login/page.tsx` accesses `searchParams.redirect` synchronously
- **Evidence**: Dev logs show repeated error: "Route `/login` used `searchParams.redirect`. `searchParams` is a Promise"
- **Affected**: `/login`, likely other pages using `searchParams`
- **Severity**: **High**
- **Root Cause**: Next.js 15 made `searchParams` async; code not updated
- **Recommended Fix**:
  ```tsx
  // Change from:
  const redirect = (searchParams.redirect as string) || "/dashboard/admin";
  // To:
  const redirect = (await searchParams).redirect || "/dashboard/admin";
  ```
- **Expected Impact**: Eliminates hydration errors and console spam

---

### 🟡 POSSIBLE PROBLEMS (Medium Severity)

#### Issue 6: Cross-Origin HMR Blocking
- **Description**: Dev server blocks HMR from network IP (192.168.1.200)
- **Evidence**: Log warning at 00:02:16
- **Affected**: Development from network devices
- **Recommended Fix**: Add `allowedDevOrigins: ['192.168.1.200']` to `next.config.ts`

#### Issue 7: Form `value` Without `onChange` Warnings
- **Description**: Multiple "You provided a `value` prop to a form field without an `onChange` handler" errors
- **Evidence**: Dev logs at 00:09:09, 00:11:04 (demo page)
- **Affected**: `/demo` page forms
- **Recommended Fix**: Use `defaultValue` for uncontrolled inputs or add `onChange`

#### Issue 8: Missing `metadataBase` in Metadata
- **Description**: Repeated warnings about `metadataBase` not set for OG/Twitter images
- **Evidence**: 10+ warnings in dev logs
- **Affected**: All pages with metadata exports
- **Recommended Fix**: Add to root layout:
  ```tsx
  export const metadata: Metadata = {
    metadataBase: new URL('http://localhost:3000'),
    // ...
  }
  ```

#### Issue 9: Deprecated Middleware Convention
- **Description**: Next.js warns middleware file convention is deprecated; should use "proxy"
- **Evidence**: Startup warning at 00:00:10
- **Recommended Fix**: Migrate to `next.config.ts` proxy config or keep middleware (still works but deprecated)

#### Issue 10: Large Homepage Component Tree
- **Description**: Homepage renders 8 sections + header + footer all as client components
- **Evidence**: `page.tsx` imports 8 section components, all `"use client"`
- **Affected**: Homepage compilation and hydration
- **Recommended Fix**: Convert static sections to Server Components; only hydrate interactive parts

---

### 🟢 MINOR ISSUES (Low Severity)

#### Issue 11: Invalid `experimental.turbo` Config
- **Description**: `next.config.ts` has `experimental: { turbo: false }` which is unrecognized
- **Evidence**: Startup warning
- **Fix**: Remove or use valid Turbopack config

#### Issue 12: Console Warnings in Development
- **Description**: Supabase client logs warnings on server startup (lines 78–91 in client.ts)
- **Fix**: Guard with `process.env.NODE_ENV === 'development'`

---

## 4. Hardware & Environment Limitations

| Factor | Assessment |
|--------|------------|
| **Application Code** | Primary bottleneck — architecture patterns cause redundant work |
| **Next.js Compilation** | Major factor — webpack + large component tree |
| **Node.js Process** | Normal — v24.18.0 is performant |
| **Supabase Network** | Remote project adds ~50–150ms latency per query |
| **Local Database** | Not used — remote Supabase only |
| **Browser Extensions** | Not measured — could add overhead |
| **System Resources** | Not measured — assume adequate |

**Conclusion**: Slowness is **primarily application code and Next.js configuration**, not hardware.

---

## 5. Priority-Ordered Top 5 Bottlenecks

| Priority | Bottleneck | Impact | Effort to Fix |
|----------|------------|--------|---------------|
| **1** | **Next.js dev compilation (webpack, no Turbopack, large client component tree)** | 37–51s first load | Low–Medium (config + component splitting) |
| **2** | **Middleware Supabase queries on every request** | Dashboard nav latency | Medium (narrow matcher, cache, parallelize) |
| **3** | **AuthProvider redundant profile fetching** | All auth-protected pages | Medium (caching, server component) |
| **4** | **Per-page data fetching without deduplication** | Dashboard data loading | Medium–High (React Query/SWR integration) |
| **5** | **`searchParams` Promise handling (Next.js 15)** | Login page errors, hydration | Low (async/await fix) |

---

## 6. Recommended Action Plan

### Phase 1: Quick Wins (1–2 hours)
1. Fix `next.config.ts` — remove invalid turbo, add `metadataBase`, `allowedDevOrigins`
2. Fix `searchParams` Promise in `/login/page.tsx` and other pages
3. Fix form `value`/`onChange` warnings in `/demo/page.tsx`
4. Narrow middleware matcher to `/dashboard/:path*`

### Phase 2: Core Performance (4–8 hours)
1. Enable Turbopack properly or optimize webpack config
2. Implement request-scoped caching in middleware (parallel queries)
3. Add profile caching to AuthProvider
4. Convert static homepage sections to Server Components

### Phase 3: Architecture Improvement (1–2 weeks)
1. Integrate React Query or SWR for server state
2. Create shared data fetching hooks
3. Implement stale-while-revalidate for dashboard data
4. Add bundle analysis and code splitting

---

## 7. Verification Checklist

After fixes, verify:
- [ ] Dev server ready < 3s
- [ ] Homepage first compilation < 10s
- [ ] Dashboard navigation < 500ms
- [ ] No console errors/warnings in development
- [ ] Build completes without warnings
- [ ] Bundle size < 250 KB initial JS

---

*Report generated by automated diagnosis. All findings based on code analysis, dev server logs, and build output.*