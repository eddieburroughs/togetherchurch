import { checkRouteFeature } from "@/lib/features";
import { getTag, getTaggedPeople } from "@/features/people/server/queries";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TagDetailPage({ params }: Props) {
  await checkRouteFeature("core.people");

  const { id } = await params;
  const tag = await getTag(id);
  if (!tag) notFound();

  const people = await getTaggedPeople(id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/admin/tags"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Tags
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Tag: {tag.name}
      </h1>

      <p className="mt-2 text-sm text-zinc-500">
        {people.length} {people.length === 1 ? "person" : "people"} tagged
      </p>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/admin/people?tag=${id}`}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          View in People List
        </Link>
      </div>

      {people.length > 0 ? (
        <div className="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {people.map((p) => (
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
        <p className="mt-6 text-sm text-zinc-500">
          No people have this tag yet.
        </p>
      )}
    </main>
  );
}
