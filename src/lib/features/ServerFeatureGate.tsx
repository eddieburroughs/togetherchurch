import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getChurchFeatures } from "./getChurchFeatures";
import { hasFeature } from "./hasFeature";

/**
 * Server Component feature gate.
 * Renders children only if the feature is enabled for the current user's church.
 *
 * Usage in a Server Component:
 *   <ServerFeatureGate feature="engage.groups">
 *     <NavLink href="/admin/groups">Groups</NavLink>
 *   </ServerFeatureGate>
 */
export async function ServerFeatureGate({
  feature,
  fallback = null,
  children,
}: {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const session = await getSessionUser();
  if (!session) return <>{fallback}</>;

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) return <>{fallback}</>;

  const features = await getChurchFeatures(ctx.churchId);

  if (!hasFeature(features, feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
