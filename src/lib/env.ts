/**
 * Environment variable reader with safe defaults for development.
 * Never throws — returns empty strings for missing optional vars.
 */

function env(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export const ENV = {
  // Next.js
  SITE_URL: env("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
  NODE_ENV: env("NODE_ENV", "development"),

  // Supabase
  SUPABASE_URL: env("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: env("SUPABASE_SERVICE_ROLE_KEY"),

  // Hosts
  APP_CANONICAL_HOST: env("APP_CANONICAL_HOST", "com.togetherchurch.app"),
  APP_ALIAS_HOST: env("APP_ALIAS_HOST", "app.togetherchurch.app"),
  MARKETING_HOST: env("MARKETING_HOST", "togetherchurch.app"),
  MARKETING_HOST_WWW: env("MARKETING_HOST_WWW", "www.togetherchurch.app"),
  OPTIONAL_API_HOST: env("OPTIONAL_API_HOST"),

  // Helpers
  get isConfigured() {
    return Boolean(this.SUPABASE_URL && this.SUPABASE_ANON_KEY);
  },
  get isDev() {
    return this.NODE_ENV === "development";
  },
} as const;
