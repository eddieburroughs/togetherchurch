import { checkRouteFeature } from "@/lib/features";
import { getEvent } from "@/features/events/server/queries";
import {
  listTicketTypes,
  getUserOrderForEvent,
} from "@/features/tickets/server/queries";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { TicketPurchaseClient } from "./ticket-purchase-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MemberTicketsPage({ params }: Props) {
  await checkRouteFeature("engage.events.tickets");

  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const session = await getSessionUser();
  if (!session) redirect("/login");

  const [ticketTypes, existingOrder] = await Promise.all([
    listTicketTypes(id),
    getUserOrderForEvent(id, session.id),
  ]);

  const activeTypes = ticketTypes.filter((t) => t.active);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/dashboard/events/${id}`}
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Event
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Tickets — {event.title}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {new Date(event.starts_at).toLocaleString()}
        {event.location && ` · ${event.location}`}
      </p>

      {existingOrder && existingOrder.status === "completed" ? (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950">
          <p className="text-sm text-green-800 dark:text-green-300">
            You already have tickets for this event!
          </p>
          <p className="mt-2 font-mono text-2xl font-bold tracking-widest text-green-900 dark:text-green-200">
            {existingOrder.confirmation_code}
          </p>
          <Link
            href={`/dashboard/events/${id}/tickets/confirmation?order=${existingOrder.id}`}
            className="mt-3 inline-block text-sm text-green-600 underline dark:text-green-400"
          >
            View Confirmation & QR Code
          </Link>
        </div>
      ) : activeTypes.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          No tickets available for this event.
        </p>
      ) : (
        <TicketPurchaseClient
          eventId={id}
          ticketTypes={activeTypes.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            priceCents: t.price_cents,
            capacity: t.capacity,
          }))}
        />
      )}
    </main>
  );
}
