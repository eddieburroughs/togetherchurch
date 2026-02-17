export type HostKind = "marketing" | "app" | "api" | "unknown";

export interface HostContext {
  kind: HostKind;
  host: string;
  canonicalAppHost: string;
  marketingHosts: string[];
  appHosts: string[];
  apiHost: string | undefined;
}

/**
 * Read host config at call time (not module level) so that env vars
 * are resolved correctly in both Edge Runtime and serverless contexts.
 */
function getConfig() {
  const appCanonical =
    process.env.APP_CANONICAL_HOST || "com.togetherchurch.app";
  const appAlias = process.env.APP_ALIAS_HOST || "app.togetherchurch.app";
  const marketing = process.env.MARKETING_HOST || "togetherchurch.app";
  const marketingWww =
    process.env.MARKETING_HOST_WWW || "www.togetherchurch.app";
  const apiHost = process.env.OPTIONAL_API_HOST || undefined;

  return {
    appCanonical,
    appAlias,
    marketingHosts: [marketing, marketingWww],
    appHosts: [appCanonical, appAlias],
    localHosts: ["localhost", "127.0.0.1"],
    apiHost,
  };
}

export function getHostContext(rawHost: string | null): HostContext {
  const host = (rawHost ?? "localhost").split(":")[0].toLowerCase();
  const cfg = getConfig();

  const base: Omit<HostContext, "kind"> = {
    host,
    canonicalAppHost: cfg.appCanonical,
    marketingHosts: cfg.marketingHosts,
    appHosts: cfg.appHosts,
    apiHost: cfg.apiHost,
  };

  if (cfg.marketingHosts.includes(host)) {
    return { ...base, kind: "marketing" };
  }

  if (cfg.appHosts.includes(host) || cfg.localHosts.includes(host)) {
    return { ...base, kind: "app" };
  }

  // Vercel preview/default domains → treat as app
  if (host.endsWith(".vercel.app")) {
    return { ...base, kind: "app" };
  }

  if (cfg.apiHost && host === cfg.apiHost) {
    return { ...base, kind: "api" };
  }

  return { ...base, kind: "unknown" };
}

export function isAliasHost(host: string): boolean {
  const appAlias = process.env.APP_ALIAS_HOST || "app.togetherchurch.app";
  return host.split(":")[0].toLowerCase() === appAlias;
}
