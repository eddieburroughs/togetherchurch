"use client";

import { useFeature } from "./FeatureProvider";

/**
 * Layer 1: Navigation Hide component.
 *
 * Renders children only if the feature key is enabled.
 * Use this to wrap nav links, buttons, or sections that should
 * be hidden when a feature is not available.
 *
 * Usage:
 *   <FeatureGate feature="engage.groups">
 *     <NavLink href="/admin/groups">Groups</NavLink>
 *   </FeatureGate>
 */
export function FeatureGate({
  feature,
  fallback = null,
  children,
}: {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const enabled = useFeature(feature);
  return enabled ? <>{children}</> : <>{fallback}</>;
}
