import { checkRouteFeature } from "@/lib/features";
import { getEvent } from "@/features/events/server/queries";
import {
  listTicketTypes,
  getStripeConnect,
} from "@/features/tickets/server/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TicketTypeForm } from "./ticket-type-form";
import { TicketTypeList } from "./ticket-type-list";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminTicketsPage({ params }: Props) {
  await checkRouteFeature("engage.events.tickets");

  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const [ticketTypes, connect] = await Promise.all([
    listTicketTypes(id),
    getStripeConnect(),
  ]);

  const stripeReady = connect?.charges_enabled ?? false;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/admin/events/${id}`}
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Event
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Tickets — {event.title}
      </h1>

      {!stripeReady && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Stripe is not connected. You can only create free tickets.{" "}
            <Link
              href="/admin/settings/stripe-connect"
              className="underline font-medium"
            >
              Connect Stripe
            </Link>
          </p>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Ticket Types</h2>
        <TicketTypeList
          eventId={id}
          ticketTypes={ticketTypes.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            priceCents: t.price_cents,
            capacity: t.capacity,
            active: t.active,
            sortOrder: t.sort_order,
          }))}
        />
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Add Ticket Type</h2>
        <TicketTypeForm eventId={id} stripeReady={stripeReady} />
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href={`/admin/events/${id}/checkin`}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Check-in Scanner
        </Link>
        <Link
          href={`/admin/events/${id}/orders`}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          View Orders
        </Link>
      </div>
    </main>
  );
}
