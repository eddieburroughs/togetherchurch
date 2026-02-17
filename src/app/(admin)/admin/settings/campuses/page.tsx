import { checkRouteFeature } from "@/lib/features";
import { listCampuses } from "@/features/campuses/server/queries";
import Link from "next/link";
import { CampusForm } from "./campus-form";
import { CampusList } from "./campus-list";

export default async function CampusesPage() {
  await checkRouteFeature("org.campuses");

  const campuses = await listCampuses();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/admin/settings"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Settings
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Campuses</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Manage your church&apos;s physical locations.
      </p>

      <div className="mt-6">
        <CampusList
          campuses={campuses.map((c) => ({
            id: c.id,
            name: c.name,
            isDefault: c.is_default,
          }))}
        />
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Add Campus</h2>
        <CampusForm />
      </div>
    </main>
  );
}
