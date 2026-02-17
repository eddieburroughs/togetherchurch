import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getChurchFeatures, featureMapToObject } from "@/lib/features";
import { getChurchPlan } from "@/lib/features/featureService";
import { getSupabaseServer } from "@/lib/supabase/server";

export default async function PlanSettingsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) redirect("/login");

  const plan = await getChurchPlan(ctx.churchId);
  const featureMap = await getChurchFeatures(ctx.churchId);
  const features = featureMapToObject(featureMap);

  // Get all feature descriptions for display
  const supabase = await getSupabaseServer();
  const { data: allFeatures } = await supabase!
    .from("features")
    .select("key, description")
    .order("key");

  const featureDescriptions = new Map(
    (allFeatures ?? []).map((f) => [f.key, f.description]),
  );

  // Get plan name
  const { data: planInfo } = await supabase!
    .from("plans")
    .select("name")
    .eq("id", plan?.plan_id ?? "")
    .single();

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Plan & Features</h1>

      <div className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Current Plan
            </p>
            <p className="text-lg font-semibold">
              {planInfo?.name ?? "No plan"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Status
            </p>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                plan?.status === "active"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : plan?.status === "trial"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                    : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {plan?.status ?? "none"}
            </span>
          </div>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Enabled Features</h2>
      <div className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {(allFeatures ?? []).map((f) => {
          const isEnabled = features[f.key]?.enabled === true;
          return (
            <div
              key={f.key}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{f.description ?? f.key}</p>
                <p className="font-mono text-xs text-zinc-400">{f.key}</p>
              </div>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  isEnabled
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {isEnabled ? "Enabled" : "Not included"}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        Features are determined by your plan. Contact support to change your
        plan or request feature overrides.
      </p>
    </main>
  );
}
