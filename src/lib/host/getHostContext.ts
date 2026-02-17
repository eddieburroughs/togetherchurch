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
 * Known hosts — hardcoded for reliable matching in Edge Runtime
 * where process.env may not resolve as expected.
 */
const APP_CANONICAL_HOST = "com.togetherchurch.app";
const APP_ALIAS_HOST = "app.togetherchurch.app";

const MARKETING_HOSTS = [
  "togetherchurch.app",
  "www.togetherchurch.app",
];

const APP_HOSTS = [
  APP_CANONICAL_HOST,
  APP_ALIAS_HOST,
];

const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

export function getHostContext(rawHost: string | null): HostContext {
  const host = (rawHost ?? "localhost").split(":")[0].toLowerCase();

  const base: Omit<HostContext, "kind"> = {
    host,
    canonicalAppHost: APP_CANONICAL_HOST,
    marketingHosts: MARKETING_HOSTS,
    appHosts: APP_HOSTS,
    apiHost: undefined,
  };

  if (MARKETING_HOSTS.includes(host)) {
    return { ...base, kind: "marketing" };
  }

  if (APP_HOSTS.includes(host) || LOCAL_HOSTS.includes(host)) {
    return { ...base, kind: "app" };
  }

  // Vercel preview/default domains → treat as app
  if (host.endsWith(".vercel.app")) {
    return { ...base, kind: "app" };
  }

  return { ...base, kind: "unknown" };
}

export function isAliasHost(host: string): boolean {
  return host.split(":")[0].toLowerCase() === APP_ALIAS_HOST;
}
