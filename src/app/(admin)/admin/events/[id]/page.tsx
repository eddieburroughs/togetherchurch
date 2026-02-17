import { checkRouteFeature } from "@/lib/features";
import { getEvent, getEventRsvps, getRsvpCounts } from "@/features/events/server/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExportRsvpButton } from "./export-rsvp-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminEventDetailPage({ params }: Props) {
  await checkRouteFeature("core.events");

  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const counts = await getRsvpCounts(id);
  const rsvps = await getEventRsvps(id);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin/events" className="text-sm text-zinc-500 hover:underline">
        &larr; Back to Events
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{event.title}</h1>
        <Link
          href={`/admin/events/${id}/tickets`}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Manage Tickets
        </Link>
      </div>

      <div className="mt-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">When</dt>
            <dd>{new Date(event.starts_at).toLocaleString()}
              {event.ends_at && ` — ${new Date(event.ends_at).toLocaleString()}`}
            </dd>
          </div>
          {event.location && (
            <div className="flex justify-between">
              <dt className="text-zinc-500">Location</dt>
              <dd>{event.location}</dd>
            </div>
          )}
          {event.description && (
            <div>
              <dt className="text-zinc-500">Description</dt>
              <dd className="mt-1 whitespace-pre-wrap">{event.description}</dd>
            </div>
          )}
          {event.capacity && (
            <div className="flex justify-between">
              <dt className="text-zinc-500">Capacity</dt>
              <dd>{event.capacity}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">RSVPs</h2>
          <ExportRsvpButton eventId={id} />
        </div>

        <div className="mt-2 flex gap-4 text-sm">
          <span className="text-green-700 dark:text-green-400">Yes: {counts.yes}</span>
          <span className="text-amber-700 dark:text-amber-400">Maybe: {counts.maybe}</span>
          <span className="text-red-700 dark:text-red-400">No: {counts.no}</span>
        </div>

        <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {rsvps.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <span>{r.guest_name ?? r.user_id ?? "Anonymous"}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                r.status === "yes" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                : r.status === "maybe" ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
              }`}>
                {r.status}
              </span>
            </div>
          ))}
          {rsvps.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">No RSVPs yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
