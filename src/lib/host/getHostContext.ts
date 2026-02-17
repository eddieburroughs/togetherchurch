export type HostKind = "marketing" | "app" | "api" | "unknown";

export interface HostContext {
  kind: HostKind;
  host: string;
  canonicalAppHost: string;
  marketingHosts: string[];
  appHosts: string[];
  apiHost: string | undefined;
}

const APP_CANONICAL_HOST =
  process.env.APP_CANONICAL_HOST ?? "com.togetherchurch.app";
const APP_ALIAS_HOST =
  process.env.APP_ALIAS_HOST ?? "app.togetherchurch.app";
const MARKETING_HOST =
  process.env.MARKETING_HOST ?? "togetherchurch.app";
const MARKETING_HOST_WWW =
  process.env.MARKETING_HOST_WWW ?? "www.togetherchurch.app";
const OPTIONAL_API_HOST =
  process.env.OPTIONAL_API_HOST || undefined;

const MARKETING_HOSTS = [MARKETING_HOST, MARKETING_HOST_WWW];
const APP_HOSTS = [APP_CANONICAL_HOST, APP_ALIAS_HOST];
const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

export function getHostContext(rawHost: string | null): HostContext {
  const host = (rawHost ?? "localhost").split(":")[0].toLowerCase();

  const base: Omit<HostContext, "kind"> = {
    host,
    canonicalAppHost: APP_CANONICAL_HOST,
    marketingHosts: MARKETING_HOSTS,
    appHosts: APP_HOSTS,
    apiHost: OPTIONAL_API_HOST,
  };

  if (MARKETING_HOSTS.includes(host)) {
    return { ...base, kind: "marketing" };
  }

  if (APP_HOSTS.includes(host) || LOCAL_HOSTS.includes(host)) {
    return { ...base, kind: "app" };
  }

  if (OPTIONAL_API_HOST && host === OPTIONAL_API_HOST) {
    return { ...base, kind: "api" };
  }

  return { ...base, kind: "unknown" };
}

export function isAliasHost(host: string): boolean {
  return host.split(":")[0].toLowerCase() === APP_ALIAS_HOST;
}
