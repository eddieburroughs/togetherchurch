import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getChurchFeatures } from "@/lib/features/getChurchFeatures";
import { hasFeature } from "@/lib/features/hasFeature";
import { getCampusMode, listCampuses } from "@/features/campuses/server/queries";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CampusModeToggle } from "./campus-mode-toggle";

export default async function ChurchSettingsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) redirect("/login");

  const features = await getChurchFeatures(ctx.churchId);
  const hasCampusFeature = hasFeature(features, "org.campuses");
  const campusMode = await getCampusMode();
  const campuses = hasCampusFeature ? await listCampuses() : [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/admin/settings"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Settings
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Church Settings
      </h1>

      <div className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-500">Campus Mode</h2>
        {hasCampusFeature ? (
          <>
            <p className="mt-1 text-xs text-zinc-500">
              Controls whether campuses are used across the app.
            </p>
            <div className="mt-3">
              <CampusModeToggle currentMode={campusMode} />
            </div>
            {campuses.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-zinc-500">
                  {campuses.length} campus{campuses.length !== 1 ? "es" : ""} configured.{" "}
                  <Link href="/admin/settings/campuses" className="underline">
                    Manage
                  </Link>
                </p>
              </div>
            )}
            {campuses.length === 0 && campusMode !== "off" && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                No campuses configured yet.{" "}
                <Link href="/admin/settings/campuses" className="underline">
                  Add campuses
                </Link>{" "}
                for campus mode to take effect.
              </p>
            )}
          </>
        ) : (
          <p className="mt-1 text-sm text-zinc-500">
            Campus management is not available on your current plan.{" "}
            <Link
              href="/admin/upgrade?feature=org.campuses"
              className="underline"
            >
              Upgrade
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
