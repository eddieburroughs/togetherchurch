import { NextRequest, NextResponse } from "next/server";
import { getHostContext, isAliasHost } from "@/lib/host/getHostContext";

/**
 * Paths that are always allowed regardless of host:
 * static assets, Next.js internals, favicon, health check.
 */
const PASSTHROUGH = /^\/(_next|favicon\.ico|health)/;

/** Routes that belong to the app (not marketing). */
const APP_ROUTES = /^\/(login|dashboard|admin|api)(\/|$)/;

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Always allow static assets and internals
  if (PASSTHROUGH.test(pathname)) {
    return NextResponse.next();
  }

  const rawHost = request.headers.get("host");
  const ctx = getHostContext(rawHost);

  // --- A) Alias redirect: app.* -> com.* ---
  if (isAliasHost(rawHost ?? "")) {
    const url = new URL(`https://${ctx.canonicalAppHost}${pathname}${search}`);
    return NextResponse.redirect(url, 301);
  }

  // --- B) Marketing hosts: only public routes ---
  if (ctx.kind === "marketing") {
    if (APP_ROUTES.test(pathname)) {
      const url = new URL(
        `https://${ctx.canonicalAppHost}/login`,
      );
      return NextResponse.redirect(url, 302);
    }
    return NextResponse.next();
  }

  // --- C) App host (canonical or localhost): allow everything ---
  if (ctx.kind === "app") {
    return NextResponse.next();
  }

  // --- D) Optional API host: only /api/* ---
  if (ctx.kind === "api") {
    if (pathname.startsWith("/api")) {
      return NextResponse.next();
    }
    return new NextResponse("Not Found", { status: 404 });
  }

  // --- E) Unknown host in production: 404 ---
  if (process.env.NODE_ENV === "production") {
    return new NextResponse("Not Found", { status: 404 });
  }

  // In dev, allow everything (permissive)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)",
  ],
};
