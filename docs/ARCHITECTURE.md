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

- Feature keys map to a church's subscription plan.
- Keys are stored in the `org_features` table and cached per-request.
- A module is enabled only when its feature key is active for the current org.

## 3-Layer Enforcement

Access control is enforced at three layers — all three must agree:

### 1. Navigation Hide
The sidebar/nav only renders links for features the org has access to.
Users never see UI for features they cannot use.

### 2. Route Guard (Middleware)
Next.js middleware checks the feature key before allowing access to a route group.
Unauthorized requests receive a 403 or redirect to an upgrade page.

### 3. Server Action Guard
Every server action / API handler verifies the feature key before executing.
This is the last line of defense and prevents direct API abuse.

```
User Request
  → Nav only shows allowed links          (layer 1: UI)
  → Middleware blocks disallowed routes    (layer 2: route)
  → Server action re-checks before write  (layer 3: action)
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
