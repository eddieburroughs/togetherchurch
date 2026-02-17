import { checkRouteFeature } from "@/lib/features";
import { getPerson, getPersonTags } from "@/features/people/server/queries";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PersonDetailPage({ params }: Props) {
  await checkRouteFeature("core.people");

  const { id } = await params;
  const person = await getPerson(id);
  if (!person) notFound();

  const tags = await getPersonTags(id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/admin/people"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to People
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        {person.first_name} {person.last_name}
      </h1>

      <div className="mt-6 space-y-4">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-500">
            Contact Information
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Email</dt>
              <dd>{person.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Phone</dt>
              <dd>{person.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Status</dt>
              <dd>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    person.status === "active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {person.status}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {tags.length > 0 && (
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-500">Tags</h2>
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((t) => (
                <span
                  key={t.id}
                  className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500">
            Notes and activity timeline coming soon.
          </p>
        </div>
      </div>
    </main>
  );
}
