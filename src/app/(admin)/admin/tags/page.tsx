import { checkRouteFeature } from "@/lib/features";
import { listTagsWithCounts } from "@/features/people/server/queries";
import { TagActions } from "./tag-actions";
import Link from "next/link";
import { TagDeleteButton } from "./tag-delete-button";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function TagsPage({ searchParams }: Props) {
  await checkRouteFeature("core.people");

  const params = await searchParams;
  const search = params.q ?? "";
  const tags = await listTagsWithCounts(search);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Tags</h1>

      <TagActions />

      <form className="mt-4">
        <input name="q" type="text" placeholder="Search tags..."
          defaultValue={search}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
      </form>

      <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {tags.map((t) => (
          <div key={t.id} className="flex items-center justify-between px-4 py-3">
            <Link
              href={`/admin/tags/${t.id}`}
              className="flex items-center gap-2 text-sm font-medium hover:underline"
            >
              {t.name}
              <span className="text-xs text-zinc-500">
                ({t.people_count ?? 0})
              </span>
            </Link>
            <TagDeleteButton tagId={t.id} tagName={t.name} />
          </div>
        ))}
        {tags.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            No tags yet.
          </p>
        )}
      </div>
    </main>
  );
}
