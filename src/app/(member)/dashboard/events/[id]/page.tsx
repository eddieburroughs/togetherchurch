import { checkRouteFeature } from "@/lib/features";
import { getEvent, getUserRsvp, getRsvpCounts } from "@/features/events/server/queries";
import { getCalendarLinks, type IcsEvent } from "@/features/events/lib/ics";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { RsvpButtons } from "./rsvp-buttons";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MemberEventDetailPage({ params }: Props) {
  await checkRouteFeature("core.events");

  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const session = await getSessionUser();
  if (!session) redirect("/login");

  const [userRsvp, counts] = await Promise.all([
    getUserRsvp(id, session.id),
    getRsvpCounts(id),
  ]);

  const icsEvent: IcsEvent = {
    uid: `${event.id}@togetherchurch`,
    title: event.title,
    description: event.description,
    location: event.location,
    startsAt: new Date(event.starts_at),
    endsAt: event.ends_at ? new Date(event.ends_at) : null,
  };

  const calLinks = getCalendarLinks(icsEvent);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard/events" className="text-sm text-zinc-500 hover:underline">
        &larr; Back to Events
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{event.title}</h1>

      <div className="mt-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">When</dt>
            <dd>
              {new Date(event.starts_at).toLocaleString()}
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
              <dt className="text-zinc-500">Spots</dt>
              <dd>{counts.yes} / {event.capacity}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Your RSVP</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {userRsvp
            ? `You responded: ${userRsvp.status}`
            : "You haven't responded yet."}
        </p>
        <div className="mt-3">
          <RsvpButtons eventId={id} currentStatus={userRsvp?.status ?? null} />
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-sm text-zinc-500">
        <span className="text-green-700 dark:text-green-400">Going: {counts.yes}</span>
        <span className="text-amber-700 dark:text-amber-400">Maybe: {counts.maybe}</span>
      </div>

      <div className="mt-6">
        <Link
          href={`/dashboard/events/${id}/tickets`}
          className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Get Tickets
        </Link>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Add to Calendar</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <a
            href={calLinks.google}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Google Calendar
          </a>
          <a
            href={calLinks.outlook}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Outlook
          </a>
          <a
            href={`/api/ics/download?eventId=${id}`}
            className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Download .ics (Apple)
          </a>
        </div>
      </div>
    </main>
  );
}
