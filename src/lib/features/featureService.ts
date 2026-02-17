import { getSupabaseServer } from "@/lib/supabase/server";
import { getChurchFeatures } from "./getChurchFeatures";
import { hasFeature, getFeatureConfig as getConfig } from "./hasFeature";

/**
 * Centralized feature service — server-only.
 * Provides the four canonical operations for feature gating.
 */

/**
 * Returns the church's current plan ID and status, or null.
 */
export async function getChurchPlan(churchId: string) {
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const { data } = await supabase
    .from("church_subscriptions")
    .select("plan_id, status, current_period_end")
    .eq("church_id", churchId)
    .single();

  return data;
}

/**
 * Returns true if the given feature key is enabled for the church.
 * Uses the cached feature map when available.
 */
export async function isFeatureEnabled(
  churchId: string,
  featureKey: string,
): Promise<boolean> {
  const features = await getChurchFeatures(churchId);
  return hasFeature(features, featureKey);
}

/**
 * Returns the config object for a feature key, or empty object.
 */
export async function getFeatureConfigForChurch(
  churchId: string,
  featureKey: string,
): Promise<Record<string, unknown>> {
  const features = await getChurchFeatures(churchId);
  return getConfig(features, featureKey);
}

export class FeatureNotEnabledError extends Error {
  public featureKey: string;

  constructor(featureKey: string) {
    super(`Feature "${featureKey}" is not available on your current plan.`);
    this.name = "FeatureNotEnabledError";
    this.featureKey = featureKey;
  }
}

/**
 * Throws FeatureNotEnabledError if the feature is not enabled.
 * Use this in server actions and API routes.
 */
export async function requireFeatureForChurch(
  churchId: string,
  featureKey: string,
): Promise<void> {
  const enabled = await isFeatureEnabled(churchId, featureKey);
  if (!enabled) {
    throw new FeatureNotEnabledError(featureKey);
  }
}
