import { checkRouteFeature } from "@/lib/features";
import { listSubmissions, listForms } from "@/features/forms/server/queries";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ form?: string; page?: string }>;
}

export default async function FormsInboxPage({ searchParams }: Props) {
  await checkRouteFeature("core.forms");

  const params = await searchParams;
  const formFilter = params.form ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;

  const forms = await listForms();
  const { data: submissions, count } = await listSubmissions({
    formId: formFilter || undefined,
    offset,
    limit,
  });
  const totalPages = Math.ceil(count / limit);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
        &larr; Admin
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Form Submissions</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/inbox/forms"
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            !formFilter
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
              : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          }`}
        >
          All
        </Link>
        {forms.map((f) => (
          <Link
            key={f.id}
            href={`/admin/inbox/forms?form=${f.id}`}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              formFilter === f.id
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            {f.title}
          </Link>
        ))}
      </div>

      <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {submissions.map((s) => {
          const name =
            (s.payload.first_name as string) ||
            (s.payload.name as string) ||
            "Anonymous";
          const preview =
            (s.payload.request as string) ||
            (s.payload.email as string) ||
            "";

          return (
            <Link
              key={s.id}
              href={`/admin/inbox/forms/${s.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{name}</p>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {s.form_title ?? "Form"}
                  </span>
                </div>
                {preview && (
                  <p className="mt-0.5 truncate text-xs text-zinc-500">{preview}</p>
                )}
              </div>
              <span className="ml-4 shrink-0 text-xs text-zinc-400">
                {new Date(s.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </Link>
          );
        })}
        {submissions.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            No submissions yet.
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
                href={`/admin/inbox/forms?form=${formFilter}&page=${page - 1}`}
                className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/inbox/forms?form=${formFilter}&page=${page + 1}`}
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
