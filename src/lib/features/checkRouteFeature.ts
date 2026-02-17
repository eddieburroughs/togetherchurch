import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getChurchFeatures } from "./getChurchFeatures";
import { hasFeature } from "./hasFeature";

/**
 * Layer 2: Route Guard.
 *
 * Call in a page or layout Server Component to enforce that the
 * current user's church has a specific feature enabled.
 *
 * Redirects to the upgrade page if the feature is not available.
 *
 * Usage in a page.tsx:
 *   export default async function GroupsPage() {
 *     await checkRouteFeature("engage.groups");
 *     return <div>Groups content</div>;
 *   }
 */
export async function checkRouteFeature(featureKey: string): Promise<void> {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) redirect("/login");

  const features = await getChurchFeatures(ctx.churchId);

  if (!hasFeature(features, featureKey)) {
    redirect(`/admin/upgrade?feature=${encodeURIComponent(featureKey)}`);
  }
}
