import { checkRouteFeature } from "@/lib/features";
import { listPeople, listTags } from "@/features/people/server/queries";
import Link from "next/link";
import { ExportButton } from "./export-button";

interface Props {
  searchParams: Promise<{ q?: string; page?: string; tag?: string }>;
}

export default async function PeoplePage({ searchParams }: Props) {
  await checkRouteFeature("core.people");

  const params = await searchParams;
  const search = params.q ?? "";
  const tagFilter = params.tag ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;

  const [{ data: people, count }, tags] = await Promise.all([
    listPeople(search, offset, limit, tagFilter ? { tagId: tagFilter } : undefined),
    listTags(),
  ]);
  const totalPages = Math.ceil(count / limit);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">People</h1>
        <div className="flex gap-2">
          <ExportButton />
          <Link
            href="/admin/import/people"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Import CSV
          </Link>
          <Link
            href="/admin/people/new"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Add Person
          </Link>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <form className="flex-1">
          {tagFilter && <input type="hidden" name="tag" value={tagFilter} />}
          <input
            name="q"
            type="text"
            placeholder="Search by name, email, or phone..."
            defaultValue={search}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </form>
        {tags.length > 0 && (
          <div>
            <select
              defaultValue={tagFilter}
              onChange={undefined}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              <option value="">All tags</option>
              {tags.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tag filter links (since select onChange needs JS, use links) */}
      {tagFilter && (
        <div className="mt-2">
          <Link
            href={`/admin/people${search ? `?q=${search}` : ""}`}
            className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {tags.find((t) => t.id === tagFilter)?.name ?? "Tag"} &times;
          </Link>
        </div>
      )}

      <p className="mt-3 text-sm text-zinc-500">
        {count} {count === 1 ? "person" : "people"} total
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {people.map((p) => (
              <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/people/${p.id}`}
                    className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {p.last_name}, {p.first_name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {p.email ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {p.phone ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
            {people.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  {search || tagFilter ? "No people match your filters." : "No people yet. Add one or import a CSV."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/people?q=${search}&tag=${tagFilter}&page=${page - 1}`}
                className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/people?q=${search}&tag=${tagFilter}&page=${page + 1}`}
                className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Tag filter navigation (progressive enhancement) */}
      {tags.length > 0 && !tagFilter && (
        <div className="mt-6">
          <h2 className="text-sm font-medium text-zinc-500">Filter by tag</h2>
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((t) => (
              <Link
                key={t.id}
                href={`/admin/people?tag=${t.id}${search ? `&q=${search}` : ""}`}
                className="inline-block rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
