import { checkRouteFeature } from "@/lib/features";
import { getPerson, getPersonTags, getHousehold } from "@/features/people/server/queries";
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

  const [tags, household] = await Promise.all([
    getPersonTags(id),
    person.household_id ? getHousehold(person.household_id) : null,
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/admin/people"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to People
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {person.first_name} {person.last_name}
        </h1>
        <Link
          href={`/admin/people/${id}/edit`}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Edit
        </Link>
      </div>

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
            {household && (
              <div className="flex justify-between">
                <dt className="text-zinc-500">Household</dt>
                <dd>
                  <Link
                    href={`/admin/households/${household.id}`}
                    className="text-zinc-900 hover:underline dark:text-zinc-100"
                  >
                    {household.name}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {tags.length > 0 && (
          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-500">Tags</h2>
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((t) => (
                <Link
                  key={t.id}
                  href={`/admin/tags/${t.id}`}
                  className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
