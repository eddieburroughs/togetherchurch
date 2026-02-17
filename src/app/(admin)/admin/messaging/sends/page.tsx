import { checkRouteFeature } from "@/lib/features";
import { listSends } from "@/features/messaging/server/queries";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function SendsPage({ searchParams }: Props) {
  await checkRouteFeature("core.messaging_sms");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;

  const { data: sends, count } = await listSends({ offset, limit });
  const totalPages = Math.ceil(count / limit);

  const statusColors: Record<string, string> = {
    queued: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
    sent: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
        &larr; Admin
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Send Log</h1>
        <Link
          href="/admin/messaging/compose"
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Compose
        </Link>
      </div>

      <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {sends.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {s.channel.toUpperCase()}
                </span>
                <span className="text-xs text-zinc-500">
                  {s.audience_type === "all"
                    ? "All People"
                    : `Tag`}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm">
                {s.subject ? `${s.subject} — ` : ""}
                {s.body.length > 80 ? s.body.slice(0, 80) + "..." : s.body}
              </p>
              {s.error && (
                <p className="mt-0.5 text-xs text-red-500">{s.error}</p>
              )}
            </div>
            <div className="ml-4 flex shrink-0 flex-col items-end gap-1">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[s.status] ?? ""}`}
              >
                {s.status}
              </span>
              <span className="text-xs text-zinc-400">
                {new Date(s.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
        {sends.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            No messages sent yet.
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
                href={`/admin/messaging/sends?page=${page - 1}`}
                className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/messaging/sends?page=${page + 1}`}
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
