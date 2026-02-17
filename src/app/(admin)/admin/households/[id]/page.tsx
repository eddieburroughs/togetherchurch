import { checkRouteFeature } from "@/lib/features";
import { getHousehold, getHouseholdMembers } from "@/features/people/server/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { HouseholdDetailActions } from "./household-detail-actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function HouseholdDetailPage({ params }: Props) {
  await checkRouteFeature("core.people");

  const { id } = await params;
  const household = await getHousehold(id);
  if (!household) notFound();

  const members = await getHouseholdMembers(id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/admin/households"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Households
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{household.name}</h1>
      </div>

      <HouseholdDetailActions householdId={id} householdName={household.name} />

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-zinc-500">
          Members ({members.length})
        </h2>

        {members.length > 0 ? (
          <div className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {members.map((p) => (
              <Link
                key={p.id}
                href={`/admin/people/${p.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              >
                <span className="text-sm font-medium">
                  {p.first_name} {p.last_name}
                </span>
                <span className="text-xs text-zinc-500">
                  {p.email ?? p.phone ?? ""}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">
            No members in this household yet. Assign people via their profile.
          </p>
        )}
      </div>
    </main>
  );
}
