import { checkRouteFeature } from "@/lib/features";
import { listEvents } from "@/features/events/server/queries";
import Link from "next/link";

export default async function MemberEventsPage() {
  await checkRouteFeature("core.events");

  const { data: events } = await listEvents({ upcoming: true, limit: 50 });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
        &larr; Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Upcoming Events</h1>

      <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {events.map((e) => (
          <Link
            key={e.id}
            href={`/dashboard/events/${e.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
          >
            <div>
              <p className="text-sm font-medium">{e.title}</p>
              <p className="text-xs text-zinc-500">
                {new Date(e.starts_at).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
                {e.location && ` · ${e.location}`}
              </p>
            </div>
            {e.featured && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                Featured
              </span>
            )}
          </Link>
        ))}
        {events.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            No upcoming events.
          </p>
        )}
      </div>
    </main>
  );
}
