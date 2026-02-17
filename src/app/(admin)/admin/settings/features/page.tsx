import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getChurchFeatures, featureMapToObject } from "@/lib/features";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function FeatureOverridesPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) redirect("/login");

  if (ctx.role !== "admin") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-sm text-red-600">Admin access required.</p>
      </main>
    );
  }

  const supabase = await getSupabaseServer();
  if (!supabase) redirect("/login");

  // Get all features and current state
  const { data: allFeatures } = await supabase
    .from("features")
    .select("key, description")
    .order("key");

  const featureMap = await getChurchFeatures(ctx.churchId);
  const features = featureMapToObject(featureMap);

  // Get current overrides
  const { data: overrides } = await supabase
    .from("church_feature_overrides")
    .select("feature_key, enabled")
    .eq("church_id", ctx.churchId);

  const overrideMap = new Map(
    (overrides ?? []).map((o) => [o.feature_key, o.enabled]),
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Feature Overrides</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        View feature states and any per-church overrides. Overrides can be
        managed by a platform super-admin.
      </p>

      <div className="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {(allFeatures ?? []).map((f) => {
          const isEnabled = features[f.key]?.enabled === true;
          const hasOverride = overrideMap.has(f.key);
          return (
            <div
              key={f.key}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{f.description ?? f.key}</p>
                <p className="font-mono text-xs text-zinc-400">{f.key}</p>
              </div>
              <div className="flex items-center gap-2">
                {hasOverride && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                    Override
                  </span>
                )}
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    isEnabled
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {isEnabled ? "On" : "Off"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        Feature overrides allow enabling or disabling specific features
        independent of your plan. Contact support to request changes.
      </p>
    </main>
  );
}
