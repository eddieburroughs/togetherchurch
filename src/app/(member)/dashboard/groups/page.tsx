import { checkRouteFeature } from "@/lib/features";
import { getMyGroups } from "@/features/groups/server/queries";
import Link from "next/link";

export default async function MemberGroupsPage() {
  await checkRouteFeature("engage.groups");

  const groups = await getMyGroups();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
        &larr; Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">My Groups</h1>

      <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {groups.map((g) => (
          <Link
            key={g.id}
            href={`/dashboard/groups/${g.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
          >
            <div>
              <p className="text-sm font-medium">{g.name}</p>
              {g.description && (
                <p className="text-xs text-zinc-500">
                  {g.description.length > 80
                    ? g.description.slice(0, 80) + "..."
                    : g.description}
                </p>
              )}
            </div>
          </Link>
        ))}
        {groups.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            You are not a member of any groups yet.
          </p>
        )}
      </div>
    </main>
  );
}
