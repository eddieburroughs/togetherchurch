import { checkRouteFeature } from "@/lib/features";
import { listTags } from "@/features/people/server/queries";
import { TagActions } from "./tag-actions";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function TagsPage({ searchParams }: Props) {
  await checkRouteFeature("core.people");

  const params = await searchParams;
  const search = params.q ?? "";
  const tags = await listTags(search);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Tags</h1>

      <TagActions />

      <form className="mt-4">
        <input name="q" type="text" placeholder="Search tags..."
          defaultValue={search}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((t) => (
          <span key={t.id}
            className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {t.name}
          </span>
        ))}
        {tags.length === 0 && (
          <p className="text-sm text-zinc-500">No tags yet.</p>
        )}
      </div>
    </main>
  );
}
