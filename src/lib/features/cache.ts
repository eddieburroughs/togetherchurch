import type { FeatureMap } from "./getChurchFeatures";

/**
 * Per-request in-memory cache for resolved feature maps.
 * Uses a module-level Map that gets garbage collected with the request
 * in serverless environments. For long-lived servers, entries are
 * time-bounded to 30 seconds.
 */

interface CacheEntry {
  features: FeatureMap;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 30_000; // 30 seconds

export function getCachedFeatures(churchId: string): FeatureMap | null {
  const entry = cache.get(churchId);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(churchId);
    return null;
  }
  return entry.features;
}

export function setCachedFeatures(
  churchId: string,
  features: FeatureMap,
): void {
  cache.set(churchId, { features, timestamp: Date.now() });
}

export function invalidateFeatureCache(churchId: string): void {
  cache.delete(churchId);
}
