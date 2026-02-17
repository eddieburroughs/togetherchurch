import { checkRouteFeature } from "@/lib/features";
import { listGroups } from "@/features/groups/server/queries";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminGroupsPage({ searchParams }: Props) {
  await checkRouteFeature("engage.groups");

  const params = await searchParams;
  const search = params.q ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;

  const { data: groups, count } = await listGroups({ search, offset, limit });
  const totalPages = Math.ceil(count / limit);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Groups</h1>
        <Link
          href="/admin/groups/new"
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Create Group
        </Link>
      </div>

      <form className="mt-4">
        <input
          name="q"
          type="text"
          placeholder="Search groups..."
          defaultValue={search}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </form>

      <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {groups.map((g) => (
          <Link
            key={g.id}
            href={`/admin/groups/${g.id}`}
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
            No groups yet.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/groups?q=${search}&page=${page - 1}`}
                className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/groups?q=${search}&page=${page + 1}`}
                className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
