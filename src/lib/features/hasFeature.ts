import type { FeatureConfig, FeatureMap } from "./getChurchFeatures";

/**
 * Checks if a specific feature key is enabled in a resolved feature map.
 * Returns false if the key is missing or explicitly disabled.
 */
export function hasFeature(features: FeatureMap, key: string): boolean {
  const entry = features.get(key);
  return entry?.enabled === true;
}

/**
 * Checks multiple feature keys — returns true only if ALL are enabled.
 */
export function hasAllFeatures(features: FeatureMap, keys: string[]): boolean {
  return keys.every((key) => hasFeature(features, key));
}

/**
 * Checks multiple feature keys — returns true if ANY is enabled.
 */
export function hasAnyFeature(features: FeatureMap, keys: string[]): boolean {
  return keys.some((key) => hasFeature(features, key));
}

/**
 * Gets the config for a feature key, or an empty object if not found.
 */
export function getFeatureConfig(
  features: FeatureMap,
  key: string,
): Record<string, unknown> {
  return features.get(key)?.config ?? {};
}

/**
 * Checks a feature from a serialized plain object (for client components).
 */
export function hasFeatureFromObject(
  features: Record<string, FeatureConfig>,
  key: string,
): boolean {
  return features[key]?.enabled === true;
}
