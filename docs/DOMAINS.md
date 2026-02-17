# Domain Configuration

## Production Hosts

| Host                        | Purpose                          |
| --------------------------- | -------------------------------- |
| `togetherchurch.app`        | Marketing site (apex)            |
| `www.togetherchurch.app`    | Marketing site (www redirect)    |
| `com.togetherchurch.app`    | Web app (canonical)              |
| `app.togetherchurch.app`    | Web app alias — 301 → `com.*`   |
| `api.togetherchurch.app`    | Optional dedicated API subdomain |

## Routing Rules

- **Marketing:** `togetherchurch.app` and `www.togetherchurch.app` serve the `(public)` route group.
- **App canonical:** `com.togetherchurch.app` serves `(auth)`, `(member)`, and `(admin)` route groups.
- **App alias redirect:** `app.togetherchurch.app` returns a **301 redirect** to `com.togetherchurch.app` (preserving path + query).
- **API:** Use `com.togetherchurch.app/api/*` for API routes. A dedicated `api.togetherchurch.app` subdomain is optional and can proxy to the same origin.

## Middleware Behavior

The middleware (`src/middleware.ts`) reads the `Host` header and enforces:

| Host                   | Allowed routes                 | Otherwise                       |
| ---------------------- | ------------------------------ | ------------------------------- |
| `togetherchurch.app`   | `(public)` only                | 302 → `com.*/login`            |
| `www.togetherchurch.app` | `(public)` only              | 302 → `com.*/login`            |
| `com.togetherchurch.app` | All routes                   | —                               |
| `app.togetherchurch.app` | —                            | 301 → `com.*` (preserve path)  |
| `api.togetherchurch.app` | `/api/*` only                | 404                             |
| `localhost` / `127.0.0.1` | All routes (dev)            | —                               |
| Unknown (production)   | —                              | 404                             |

## Environment Variables

```bash
APP_CANONICAL_HOST=com.togetherchurch.app
APP_ALIAS_HOST=app.togetherchurch.app
MARKETING_HOST=togetherchurch.app
MARKETING_HOST_WWW=www.togetherchurch.app
# OPTIONAL_API_HOST=api.togetherchurch.app
```

## Local Development

### /etc/hosts Setup

Add to `/etc/hosts`:

```
127.0.0.1  togetherchurch.local
127.0.0.1  www.togetherchurch.local
127.0.0.1  com.togetherchurch.local
127.0.0.1  app.togetherchurch.local
```

Then set env overrides in `.env.local`:

```bash
APP_CANONICAL_HOST=com.togetherchurch.local
APP_ALIAS_HOST=app.togetherchurch.local
MARKETING_HOST=togetherchurch.local
MARKETING_HOST_WWW=www.togetherchurch.local
```

### Testing with curl

**Marketing host (should show homepage):**
```bash
curl -s http://localhost:3000/ -H "Host: togetherchurch.app"
```

**App alias redirect (should 301 to com.*):**
```bash
curl -v http://localhost:3000/dashboard -H "Host: app.togetherchurch.app"
# Expect: 301 -> https://com.togetherchurch.app/dashboard
```

**Marketing host hitting app route (should redirect to com.*/login):**
```bash
curl -v http://localhost:3000/login -H "Host: togetherchurch.app"
# Expect: 302 -> https://com.togetherchurch.app/login
```

**App canonical host (should work):**
```bash
curl -s http://localhost:3000/login -H "Host: com.togetherchurch.app"
# Expect: 200, login page
```

**Localhost (should work as app host):**
```bash
curl -s http://localhost:3000/login
# Expect: 200, login page
```

**Health check (always works regardless of host):**
```bash
curl -s http://localhost:3000/health -H "Host: togetherchurch.app"
# Expect: 200, "OK"
```

## SSL / TLS

In production, use a reverse proxy (Caddy, nginx, etc.) to terminate TLS for all subdomains.
A wildcard certificate for `*.togetherchurch.app` plus the apex covers all hosts.
