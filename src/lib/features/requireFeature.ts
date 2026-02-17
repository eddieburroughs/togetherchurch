import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getChurchFeatures } from "./getChurchFeatures";
import { hasFeature } from "./hasFeature";

/**
 * Layer 3: Server Action Guard.
 *
 * Call at the top of any server action or API route handler to enforce
 * that the current user's church has a specific feature enabled.
 *
 * Throws an error if:
 * - User is not authenticated
 * - User has no church membership
 * - The feature key is not enabled for the church
 *
 * Returns the church context on success for further use.
 */
export async function requireFeature(featureKey: string) {
  const session = await getSessionUser();
  if (!session) {
    throw new Error("Authentication required.");
  }

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) {
    throw new Error("No church membership found.");
  }

  const features = await getChurchFeatures(ctx.churchId);

  if (!hasFeature(features, featureKey)) {
    throw new Error(
      `Feature "${featureKey}" is not available on your current plan.`,
    );
  }

  return { session, ctx, features };
}

/**
 * Same as requireFeature but checks multiple keys — all must be enabled.
 */
export async function requireAllFeatures(featureKeys: string[]) {
  const session = await getSessionUser();
  if (!session) {
    throw new Error("Authentication required.");
  }

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) {
    throw new Error("No church membership found.");
  }

  const features = await getChurchFeatures(ctx.churchId);

  for (const key of featureKeys) {
    if (!hasFeature(features, key)) {
      throw new Error(
        `Feature "${key}" is not available on your current plan.`,
      );
    }
  }

  return { session, ctx, features };
}
