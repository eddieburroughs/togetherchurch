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

## Local Development

For local testing with host-based routing, add these entries to `/etc/hosts`:

```
127.0.0.1  togetherchurch.local
127.0.0.1  com.togetherchurch.local
127.0.0.1  app.togetherchurch.local
```

Then access:
- `http://togetherchurch.local:3000` — marketing
- `http://com.togetherchurch.local:3000` — app
- `http://app.togetherchurch.local:3000` — alias (should redirect)

## SSL / TLS

In production, use a reverse proxy (Caddy, nginx, etc.) to terminate TLS for all subdomains.
A wildcard certificate for `*.togetherchurch.app` plus the apex covers all hosts.
