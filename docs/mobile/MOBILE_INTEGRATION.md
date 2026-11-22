# Mobile Integration Guide — CALLBACX MARKETING Admin Dashboard

This document outlines the steps to transition the CALLBACX admin dashboard from
a Progressive Web App (PWA) to native Android and iOS applications using Expo /
React Native.

---

## 1. Current State (PWA)

The admin dashboard is built as a Next.js 16 application with PWA foundations:

- **Web app manifest**: `public/manifest.json` — defines app name, icons, theme
  colors, display mode, and shortcuts.
- **Service worker**: `public/sw.js` — caches static assets, serves offline
  fallback (`/offline.html`), caches API responses (network-first), handles push
  notifications.
- **Offline page**: `public/offline.html` — shown when the user is offline and
  requests a navigation route.
- **Icons**: SVG placeholder icons in `public/icons/` (replace with PNG for
  production).
- **Install prompt**: `src/components/pwa/SWRegister.tsx` — shows an "Install
  App" button when `beforeinstallprompt` fires.
- **Responsive layouts**: All admin pages use `AdminDataTable` and `StatCard`
  which adapt from mobile (xs) to desktop (2xl) breakpoints.
- **Shared types**: `src/lib/types/admin.ts` — platform-agnostic TypeScript
  types shared between web and mobile.
- **Shared service layer**: `src/services/admin.ts` — all business logic accepts
  an optional Supabase client parameter, making it reusable by any client.
- **Shared API routes**: `src/app/api/admin/*` — platform-agnostic REST
  endpoints returning a consistent JSON envelope.

---

## 2. Reusable Assets for Mobile

The following can be reused directly in an Expo / React Native app:

| Asset | Location | Reusable For |
|-------|----------|--------------|
| Admin types | `src/lib/types/admin.ts` | TypeScript interfaces (web + RN) |
| Validation schemas | `src/lib/validations/admin.ts` | Zod schemas (shared logic) |
| Service layer | `src/services/admin.ts` | Business logic (client-injectable) |
| Error types | `src/lib/errors.ts` | `ServiceResult<T>` envelope |
| RBAC permissions | `src/lib/rbac.ts` | Permission constants & role checks |
| API contract | `src/app/api/admin/_helper.ts` | JSON response envelope shape |

---

## 3. Android Integration Steps

### 3.1. Create Expo Project

```bash
npx create-expo-app callbacx-admin-mobile --template blank-typescript
cd callbacx-admin-mobile
npx expo install expo-status-bar expo-splash-screen expo-updates
npx expo install react-native-svg react-native-safe-area-context
npx expo install @react-navigation/native @react-navigation/stack
npx expo install react-native-gesture-handler react-native-reanimated
```

### 3.2. Configure `app.json`

```json
{
  "expo": {
    "name": "CALLBACX Marketing",
    "slug": "callbacx-admin",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0f172a"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "bundleIdentifier": "com.callbacx.admin",
      "buildNumber": "1.0.0"
    },
    "android": {
      "package": "com.callbacx.admin",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0f172a"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "manifest": "./manifest.json"
    },
    "plugins": [
      "expo-router",
      "expo-notifications"
    ]
  }
}
```

### 3.3. Connect to Supabase Backend

The mobile app uses the same Supabase backend as the web app:

```tsx
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);
```

### 3.4. Reuse Admin Service Logic

Copy `src/services/admin.ts` into the mobile project. The functions accept an
optional `client` parameter, so pass the Expo Supabase client:

```tsx
import { listAdminUsers } from "./services/admin";
import { supabase } from "./lib/supabase";

const { data, error } = await listAdminUsers(
  { search: "", limit: 20, offset: 0 },
  supabase
);
```

### 3.5. Android Build

```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

### 3.6. Publish to Google Play

1. Create a [Google Play Console](https://play.google.com/console) account.
2. Create an app and upload the release APK/AAB.
3. Complete store listing, privacy policy, and content rating.
4. Submit for review.

---

## 4. iOS Integration Steps

### 4.1. Create Expo Project (same as Android)

Use the same `npx create-expo-app` command above.

### 4.2. Configure `app.json` iOS Section

```json
"ios": {
  "bundleIdentifier": "com.callbacx.admin",
  "buildNumber": "1.0.0",
  "infoPlist": {
    "NSUserNotificationUsageDescription": "CALLBACX Marketing sends notifications about disputes and payments.",
    "UIAppFonts": []
  }
}
```

### 4.3. Configure Apple Push Notifications (APNs)

1. Create an [Apple Developer](https://developer.apple.com) account.
2. Create an App ID with Push Notifications capability.
3. Generate an APNs Auth Key (`.p8` file).
4. Upload the `.p8` key to Expo:
   ```bash
   npx expo push:android:upload --api-key <API_KEY>  # Android FCM
   npx expo push:ios:upload --p8-file AuthKey_XXXX.p8 --team-id <TEAM_ID>  # iOS APNs
   ```

### 4.4. iOS Build

Requires a Mac with Xcode:

```bash
npx expo prebuild --platform ios
cd ios
xcodebuild -workspace callbacx_admin.xcworkspace -scheme callbacx_admin -configuration Release -archivePath build/callbacx_admin.xcarchive archive
```

### 4.5. Publish to Apple App Store

1. Create an [App Store Connect](https://appstoreconnect.apple.com) account.
2. Create an app record.
3. Upload the build via Xcode or Transporter.
4. Complete TestFlight internal testing.
5. Submit for App Store review.

---

## 5. Shared API Contract (Web + Mobile)

All admin API endpoints return this JSON envelope:

```ts
interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: { code: string | null; message: string | null } | null;
  meta: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  } | null;
}
```

Endpoints available under `/api/admin/*`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/overview` | GET | Platform overview metrics |
| `/api/admin/users` | GET | List users (with filters) |
| `/api/admin/users/[id]` | PATCH | Update user role/status |
| `/api/admin/brands` | GET | List brands |
| `/api/admin/brands/verify` | POST | Verify/reject brand |
| `/api/admin/creators` | GET | List creators |
| `/api/admin/creators/verify` | POST | Verify/reject creator |
| `/api/admin/campaigns` | GET | List campaigns |
| `/api/admin/campaigns/moderate` | POST | Moderate campaign status |
| `/api/admin/collaborations` | GET | List collaborations |
| `/api/admin/collaborations/[id]/status` | PATCH | Update collaboration status |
| `/api/admin/payments` | GET | List payments |
| `/api/admin/disputes` | GET | List disputes |
| `/api/admin/disputes/[id]/resolve` | POST | Resolve dispute |
| `/api/admin/support-tickets` | GET | List support tickets |
| `/api/admin/support-tickets/[id]/assign` | PATCH | Assign ticket |
| `/api/admin/moderation-reports` | GET | List moderation reports |
| `/api/admin/announcements` | GET/POST | List/create announcements |
| `/api/admin/announcements/[id]` | PATCH | Update announcement |
| `/api/admin/platform-settings` | GET/POST | List/upsert settings |
| `/api/admin/activity-logs` | GET/POST | Activity logs |

Authentication: Supabase auth cookies (web) or access token header (mobile).

---

## 6. Push Notifications (Mobile)

The service worker (`public/sw.js`) already handles push events. For native
mobile:

- **Android**: Firebase Cloud Messaging (FCM) via `expo-notifications`.
- **iOS**: Apple Push Notification service (APNs) via `expo-notifications`.

Example usage:

```tsx
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleAsync: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const registerForPush = async () => {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  // Send token to your backend for targeted push delivery
};
```

---

## 7. Offline Support (Mobile)

The PWA service worker caches static assets and API responses. For native
mobile, use `expo-offline` or `AsyncStorage` to queue actions while offline
and sync when reconnected.

Example offline action queue pattern (from `src/lib/types/admin.ts`):

```ts
interface OfflineAction {
  id: string;
  action: "create" | "update" | "delete";
  resource: string;
  payload: unknown;
  created_at: string;
  retries: number;
}
```

---

## 8. Checklist Before Native Build

- [ ] Replace SVG placeholder icons with PNG (512x512, 192x192, etc.)
- [ ] Add real screenshot images to `public/screenshots/`
- [ ] Configure Supabase environment variables for mobile
- [ ] Set up Firebase (Android) and APNs (iOS) credentials
- [ ] Test all 11 admin sections on mobile breakpoints
- [ ] Verify touch targets >= 44px (iOS) / 48dp (Android)
- [ ] Run TypeScript: `npx tsc --noEmit`
- [ ] Run lint: `npx eslint .`
- [ ] Build: `npx next build`

---

## 9. Security Notice

Do not claim the platform is production-ready until all critical functionality
and security checks have passed, including:

- RLS policies verified for all admin tables
- Penetration testing completed
- Authentication and authorization audited
- API rate limiting configured
- Secrets and keys properly scoped (never expose service-role key to clients)
