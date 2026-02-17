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

  // Twilio (SMS)
  TWILIO_ACCOUNT_SID: env("TWILIO_ACCOUNT_SID"),
  TWILIO_AUTH_TOKEN: env("TWILIO_AUTH_TOKEN"),
  TWILIO_PHONE_NUMBER: env("TWILIO_PHONE_NUMBER"),

  // SMTP (Email)
  SMTP_HOST: env("SMTP_HOST"),
  SMTP_PORT: env("SMTP_PORT", "587"),
  SMTP_USER: env("SMTP_USER"),
  SMTP_PASS: env("SMTP_PASS"),
  EMAIL_FROM: env("EMAIL_FROM", "noreply@togetherchurch.app"),

  // Stripe
  STRIPE_SECRET_KEY: env("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: env("STRIPE_WEBHOOK_SECRET"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: env("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),

  // Helpers
  get isConfigured() {
    return Boolean(this.SUPABASE_URL && this.SUPABASE_ANON_KEY);
  },
  get isDev() {
    return this.NODE_ENV === "development";
  },
} as const;
