import { checkRouteFeature } from "@/lib/features";
import { listSessions } from "@/features/kids/server/queries";
import Link from "next/link";

export default async function AdminSessionsPage() {
  await checkRouteFeature("services.kids_checkin");

  const { data: sessions } = await listSessions({ limit: 50 });

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Check-in Sessions</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/kids"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Kids List
          </Link>
          <Link
            href="/admin/kids/sessions/new"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            New Session
          </Link>
        </div>
      </div>

      <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {sessions.map((s) => (
          <Link
            key={s.id}
            href={`/admin/kids/sessions/${s.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
          >
            <div>
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-zinc-500">
                {new Date(s.starts_at).toLocaleString()}
              </p>
            </div>
          </Link>
        ))}
        {sessions.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            No sessions yet.
          </p>
        )}
      </div>
    </main>
  );
}
