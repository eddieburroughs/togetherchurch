import { getSupabaseServer } from "@/lib/supabase/server";
import { getCachedFeatures, setCachedFeatures } from "./cache";

export interface FeatureConfig {
  enabled: boolean;
  config: Record<string, unknown>;
}

export type FeatureMap = Map<string, FeatureConfig>;

/**
 * Resolves the full set of enabled features for a church.
 *
 * Resolution order:
 * 1. Check per-request cache.
 * 2. Get the church's plan from church_subscriptions.
 * 3. Load all plan_features for that plan.
 * 4. Apply church_feature_overrides (can enable/disable individual keys).
 * 5. Cache and return the merged map.
 *
 * Returns an empty map if the church has no subscription or Supabase is unconfigured.
 */
export async function getChurchFeatures(
  churchId: string,
): Promise<FeatureMap> {
  // Check cache first
  const cached = getCachedFeatures(churchId);
  if (cached) return cached;

  const features: FeatureMap = new Map();

  const supabase = await getSupabaseServer();
  if (!supabase) return features;

  // 1. Get the church's plan
  const { data: sub } = await supabase
    .from("church_subscriptions")
    .select("plan_id, status")
    .eq("church_id", churchId)
    .single();

  // No subscription or canceled → no features
  if (!sub || sub.status === "canceled") return features;

  // 2. Load plan features
  const { data: planFeatures } = await supabase
    .from("plan_features")
    .select("feature_key, enabled, config")
    .eq("plan_id", sub.plan_id);

  if (planFeatures) {
    for (const pf of planFeatures) {
      features.set(pf.feature_key, {
        enabled: pf.enabled,
        config: (pf.config as Record<string, unknown>) ?? {},
      });
    }
  }

  // 3. Apply church-level overrides
  const { data: overrides } = await supabase
    .from("church_feature_overrides")
    .select("feature_key, enabled, config")
    .eq("church_id", churchId);

  if (overrides) {
    for (const ov of overrides) {
      const existing = features.get(ov.feature_key);
      features.set(ov.feature_key, {
        enabled: ov.enabled,
        config: {
          ...(existing?.config ?? {}),
          ...((ov.config as Record<string, unknown>) ?? {}),
        },
      });
    }
  }

  // Cache for subsequent calls in the same request
  setCachedFeatures(churchId, features);

  return features;
}

/**
 * Serializes FeatureMap to a plain object for passing to client components.
 */
export function featureMapToObject(
  map: FeatureMap,
): Record<string, FeatureConfig> {
  const obj: Record<string, FeatureConfig> = {};
  for (const [key, val] of map) {
    obj[key] = val;
  }
  return obj;
}
