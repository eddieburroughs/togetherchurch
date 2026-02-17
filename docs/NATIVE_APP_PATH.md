# Native App Path — Together Church

This document outlines the path from the current PWA to native iOS/Android apps
with real push notifications.

---

## Current State

- **PWA**: Basic installable PWA with manifest, icons, and `standalone` display.
- **Notifications**: In-app only — rows in the `notifications` table shown on
  `/dashboard/notifications` and `/admin/notifications`.
- **Push**: `sendPushNotifications()` in `src/lib/push/pushService.ts` writes to
  the database. No native push delivery yet.
- **Device Tokens**: `device_tokens` table exists with `platform` enum
  (`ios`, `android`, `web`) and `token` column — ready for registration.

---

## Option A: Capacitor Wrapper (Recommended)

[Capacitor](https://capacitorjs.com) wraps the existing Next.js web app in a
native WebView, giving access to native APIs (push, camera, biometrics) with
minimal code changes.

### Steps

1. **Install Capacitor**
   ```bash
   pnpm add @capacitor/core @capacitor/cli
   npx cap init "Together Church" "app.togetherchurch.com" --web-dir=out
   ```

2. **Add platforms**
   ```bash
   pnpm add @capacitor/ios @capacitor/android
   npx cap add ios
   npx cap add android
   ```

3. **Configure Next.js for static export**
   In `next.config.ts`, add `output: "export"` for the Capacitor build target.
   The production web app continues to use SSR on Vercel/Node; only the
   Capacitor build uses static export.

4. **Add push notification plugin**
   ```bash
   pnpm add @capacitor/push-notifications
   ```

5. **Register device tokens on app launch**
   ```typescript
   import { PushNotifications } from "@capacitor/push-notifications";

   PushNotifications.requestPermissions().then((result) => {
     if (result.receive === "granted") {
       PushNotifications.register();
     }
   });

   PushNotifications.addListener("registration", (token) => {
     // POST to /api/device-tokens with { platform, token: token.value }
   });
   ```

6. **Build and sync**
   ```bash
   npx next build    # or next export for static
   npx cap sync
   npx cap open ios   # opens Xcode
   npx cap open android  # opens Android Studio
   ```

7. **Submit to stores**
   - iOS: Requires Apple Developer account ($99/yr), Xcode signing, App Store
     Connect submission.
   - Android: Requires Google Play Console ($25 one-time), signed APK/AAB.

### Pros
- Minimal code changes — reuses existing web UI
- Native push, camera, biometrics via plugins
- Single codebase for web + iOS + Android
- Fast iteration — `cap sync` deploys web changes without store update

### Cons
- WebView performance (generally acceptable for content apps)
- Some native UI patterns (swipe gestures, native navigation) require plugins
- App store review process adds deployment friction

---

## Option B: React Native / Expo

Full rewrite of the UI layer in React Native. Server code (queries, actions)
stays the same via API routes.

### When to consider
- If WebView performance becomes unacceptable
- If the app needs heavy native UI (maps, video, AR)
- If you want truly native look-and-feel on both platforms

### Effort: High (3-6+ months for feature parity)

---

## Push Notification Delivery

### Architecture

```
User action → sendPushNotifications()
                ├─ Insert into notifications table (in-app, current)
                ├─ Send via APNs (iOS native)
                ├─ Send via FCM (Android native + web)
                └─ Send via OneSignal (managed alternative)
```

### Option 1: OneSignal (Managed)

Simplest path. OneSignal handles APNs/FCM, segmentation, and analytics.

1. Create OneSignal account and app
2. Configure APNs key (iOS) and FCM server key (Android)
3. Install `onesignal-node` on the server
4. Update `pushService.ts`:
   ```typescript
   import * as OneSignal from "onesignal-node";

   const client = new OneSignal.Client(APP_ID, API_KEY);

   // In sendPushNotifications:
   await client.createNotification({
     include_player_ids: deviceTokens, // from device_tokens table
     headings: { en: opts.title },
     contents: { en: opts.body },
     data: opts.data,
   });
   ```
5. Register device on app launch (OneSignal SDK handles token management)

**Cost**: Free up to 10K subscribers, then ~$9/mo.

### Option 2: Direct APNs + FCM

Full control, no third-party dependency.

#### APNs (iOS)
1. Generate APNs auth key in Apple Developer portal
2. Use `apn` npm package or HTTP/2 direct
3. Send to `api.push.apple.com` with JWT auth

#### FCM (Android + Web)
1. Create Firebase project, download `service-account.json`
2. Use `firebase-admin` SDK
3. Send via `admin.messaging().send()`

#### Web Push (Browser)
1. Generate VAPID keys
2. Service worker handles `push` event
3. Use `web-push` npm package on server

### Option 3: Hybrid

Use OneSignal for mobile (simpler device management) and direct Web Push API
for browser notifications. The `pushService.ts` abstraction supports this —
dispatch by platform from `device_tokens.platform`.

---

## Device Token Registration Flow

The `device_tokens` table is ready:

```sql
create table device_tokens (
  id           uuid primary key default gen_random_uuid(),
  church_id    uuid not null references churches(id),
  user_id      uuid not null references auth.users(id),
  platform     device_platform not null,  -- 'ios' | 'android' | 'web'
  token        text not null,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
```

### API Route (to create)

```
POST /api/device-tokens
Body: { platform: "ios" | "android" | "web", token: string }
```

- Upsert by (user_id, platform, token)
- Update `last_seen_at` on each app launch
- Delete stale tokens (>90 days without `last_seen_at` update)

### Client-side Registration

```typescript
// On app launch (after auth)
async function registerDeviceToken(platform: string, token: string) {
  await fetch("/api/device-tokens", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ platform, token }),
  });
}
```

---

## Recommended Roadmap

| Phase | What | Effort |
|-------|------|--------|
| **Done** | PWA basics (manifest, icons, install prompt) | - |
| **Done** | In-app notifications center | - |
| 1 | Web Push via VAPID + service worker | 2-3 days |
| 2 | Capacitor wrapper + app store submissions | 1-2 weeks |
| 3 | Native push via Capacitor plugin + APNs/FCM | 3-5 days |
| 4 | OneSignal integration (optional, replaces phase 1+3) | 1-2 days |

---

## Files to Modify

When implementing push delivery:

1. `src/lib/push/pushService.ts` — Add delivery logic per platform
2. `src/app/api/device-tokens/route.ts` — Create device registration endpoint
3. `public/sw.js` — Service worker for web push (if using Web Push API)
4. `capacitor.config.ts` — Capacitor configuration (when wrapping)
5. `ios/` and `android/` — Native project files (generated by Capacitor)
