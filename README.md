# Together Church

A Next.js web application for Together Church, deployed on a self-managed VPS.

## Hosts

| Purpose        | Domain                                               |
| -------------- | ---------------------------------------------------- |
| Marketing site | `togetherchurch.app` / `www.togetherchurch.app`      |
| Web app        | `app.togetherchurch.app` (alias `com.togetherchurch.app`) |
| API (optional) | `api.togetherchurch.app`                             |

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Database / Auth:** Supabase (Postgres + Auth + Storage + Realtime)
- **Package Manager:** pnpm
- **Deployment:** VPS with Node.js (self-hosted)

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Environment Variables

See [`.env.example`](.env.example) for the full list of required environment variables.
