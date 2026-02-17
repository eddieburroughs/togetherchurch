import { checkRouteFeature } from "@/lib/features";
import { listHouseholdsWithCounts } from "@/features/people/server/queries";
import { HouseholdActions } from "./household-actions";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function HouseholdsPage({ searchParams }: Props) {
  await checkRouteFeature("core.people");

  const params = await searchParams;
  const search = params.q ?? "";
  const households = await listHouseholdsWithCounts(search);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Households</h1>
      </div>

      <HouseholdActions />

      <form className="mt-4">
        <input name="q" type="text" placeholder="Search households..."
          defaultValue={search}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
      </form>

      <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {households.map((h) => (
          <Link
            key={h.id}
            href={`/admin/households/${h.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
          >
            <span className="text-sm font-medium">{h.name}</span>
            <span className="text-xs text-zinc-500">
              {h.member_count ?? 0} {(h.member_count ?? 0) === 1 ? "member" : "members"}
            </span>
          </Link>
        ))}
        {households.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            No households yet.
          </p>
        )}
      </div>
    </main>
  );
}
