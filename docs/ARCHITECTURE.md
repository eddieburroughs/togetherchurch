# Architecture

## Modular Feature System

Each feature lives in `/src/features/<name>/` as a vertical slice containing its own
components, hooks, actions, types, and utilities.

### Modules

| Module         | Description                              |
| -------------- | ---------------------------------------- |
| `core`         | Shared primitives: auth, orgs, roles     |
| `people`       | Contact directory, profiles, households  |
| `events`       | Calendar, registration, attendance       |
| `forms`        | Custom form builder + submissions        |
| `messaging`    | Email, SMS, push notifications           |
| `groups`       | Small groups, teams, serving areas       |
| `care_meals`   | Meal train / care coordination           |
| `kids_checkin`  | Child check-in / security labels        |
| `tickets`      | Support / request ticketing              |
| `campuses`     | Multi-campus management                  |

## Feature Flags + Plan Gating

Every module is gated by a **feature key** (see `docs/FEATURE_KEYS.md`).

- Feature keys map to a church's subscription plan via `plan_features`.
- Per-church overrides live in `church_feature_overrides`.
- Resolution: plan features → church overrides → merged set.
- Resolved features are cached in-memory per request (30s TTL).

### Implementation

| File | Purpose |
|------|---------|
| `src/lib/features/getChurchFeatures.ts` | Resolves full feature map for a church |
| `src/lib/features/featureService.ts` | `getChurchPlan`, `isFeatureEnabled`, `requireFeatureForChurch` |
| `src/lib/features/hasFeature.ts` | Pure helpers: `hasFeature`, `hasAllFeatures`, `hasAnyFeature` |
| `src/lib/features/cache.ts` | In-memory per-request cache (no Redis) |
| `src/lib/features/requireFeature.ts` | Layer 3: server action guard (auth + feature) |
| `src/lib/features/checkRouteFeature.ts` | Layer 2: route guard (redirects to `/admin/upgrade`) |
| `src/lib/features/FeatureProvider.tsx` | React context for client components |
| `src/lib/features/FeatureGate.tsx` | Client component: `<FeatureGate feature="x">` |
| `src/lib/features/ServerFeatureGate.tsx` | Server component: `<ServerFeatureGate feature="x">` |

### Admin UI

- `/admin/settings/plan` — shows current plan, status, and all features (read-only)
- `/admin/settings/features` — shows feature overrides (admin-only, read-only for now)
- `/admin/upgrade?feature=x` — shown when a gated route is accessed without the feature

## 3-Layer Enforcement

Access control is enforced at three layers — all three must agree:

### 1. Navigation Hide (UI)
Use `<FeatureGate>` (client) or `<ServerFeatureGate>` (server) to conditionally
render nav links. Users never see UI for features they cannot use.

```tsx
<FeatureGate feature="engage.groups">
  <NavLink href="/admin/groups">Groups</NavLink>
</FeatureGate>
```

### 2. Route Guard (Page/Layout)
Call `checkRouteFeature("key")` at the top of any page or layout.
Redirects to `/admin/upgrade?feature=key` if the feature is not enabled.

```tsx
export default async function GroupsPage() {
  await checkRouteFeature("engage.groups");
  // ...
}
```

### 3. Server Action Guard
Call `requireFeature("key")` or `requireFeatureForChurch(churchId, "key")` in server actions.
Throws `FeatureNotEnabledError` if the feature is not enabled.

```tsx
"use server";
export async function createGroup(formData: FormData) {
  const { ctx } = await requireFeature("engage.groups");
  // ...
}
```

```
User Request
  → Nav only shows allowed links          (layer 1: UI)
  → checkRouteFeature blocks page load    (layer 2: route)
  → requireFeature blocks server action   (layer 3: action)
```

## Route Groups

| Group      | Path prefix | Purpose                     |
| ---------- | ----------- | --------------------------- |
| `(public)` | `/`         | Marketing, health check     |
| `(auth)`   | `/login`    | Login, signup, password reset |
| `(member)` | `/`         | Authenticated member pages  |
| `(admin)`  | `/`         | Admin / staff pages         |

## Directory Structure

```
src/
├── app/
│   ├── (public)/      # Marketing pages
│   ├── (auth)/        # Auth flows
│   ├── (member)/      # Member dashboard
│   └── (admin)/       # Admin dashboard
├── features/          # Vertical feature slices
├── lib/               # Shared utilities
│   ├── env.ts         # Env var reader with safe defaults
│   └── supabase/      # Supabase client helpers
supabase/
└── migrations/        # SQL migration files
docs/                  # Project documentation
```
