"use client";

import { createContext, useContext } from "react";
import type { FeatureConfig } from "./getChurchFeatures";
import { hasFeatureFromObject } from "./hasFeature";

type FeatureRecord = Record<string, FeatureConfig>;

const FeatureContext = createContext<FeatureRecord>({});

/**
 * Layer 1 support: provides the resolved feature map to client components.
 * Wrap your app shell / layout with this provider, passing the serialized features.
 */
export function FeatureProvider({
  features,
  children,
}: {
  features: FeatureRecord;
  children: React.ReactNode;
}) {
  return (
    <FeatureContext.Provider value={features}>
      {children}
    </FeatureContext.Provider>
  );
}

/**
 * Hook: check if a feature is enabled in the current church context.
 * Use this in nav components to hide/show links (Layer 1: Navigation Hide).
 */
export function useFeature(key: string): boolean {
  const features = useContext(FeatureContext);
  return hasFeatureFromObject(features, key);
}

/**
 * Hook: get the full feature config for a key.
 */
export function useFeatureConfig(key: string): Record<string, unknown> {
  const features = useContext(FeatureContext);
  return features[key]?.config ?? {};
}

/**
 * Hook: get all features as a record (for bulk checks).
 */
export function useFeatures(): FeatureRecord {
  return useContext(FeatureContext);
}
