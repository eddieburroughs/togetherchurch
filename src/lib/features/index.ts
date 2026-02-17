// Feature flags barrel export

// Core resolution
export { getChurchFeatures, featureMapToObject } from "./getChurchFeatures";
export type { FeatureConfig, FeatureMap } from "./getChurchFeatures";

// Checking helpers
export {
  hasFeature,
  hasAllFeatures,
  hasAnyFeature,
  getFeatureConfig,
  hasFeatureFromObject,
} from "./hasFeature";

// Server guards (Layer 2 + 3)
export { requireFeature, requireAllFeatures } from "./requireFeature";
export { checkRouteFeature } from "./checkRouteFeature";

// Service (server-only)
export {
  getChurchPlan,
  isFeatureEnabled,
  getFeatureConfigForChurch,
  requireFeatureForChurch,
  FeatureNotEnabledError,
} from "./featureService";

// Cache
export { invalidateFeatureCache } from "./cache";

// Client components (Layer 1)
export { FeatureProvider, useFeature, useFeatureConfig, useFeatures } from "./FeatureProvider";
export { FeatureGate } from "./FeatureGate";

// Server component gate (Layer 1)
export { ServerFeatureGate } from "./ServerFeatureGate";
