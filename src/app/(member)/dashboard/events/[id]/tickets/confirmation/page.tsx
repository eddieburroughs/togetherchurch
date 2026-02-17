import { checkRouteFeature } from "@/lib/features";
import { getEvent } from "@/features/events/server/queries";
import { getOrder, getOrderItems } from "@/features/tickets/server/queries";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { QrCodeDisplay } from "./qr-code-display";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ order?: string }>;
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: Props) {
  await checkRouteFeature("engage.events.tickets");

  const { id } = await params;
  const { order: orderId } = await searchParams;

  if (!orderId) redirect(`/dashboard/events/${id}/tickets`);

  const session = await getSessionUser();
  if (!session) redirect("/login");

  const [event, order] = await Promise.all([
    getEvent(id),
    getOrder(orderId),
  ]);

  if (!event) notFound();
  if (!order || order.user_id !== session.id) notFound();

  const items = await getOrderItems(orderId);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/dashboard/events/${id}`}
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Event
      </Link>

      <div className="mt-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {order.status === "completed"
            ? "You're Confirmed!"
            : "Order Pending"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">{event.title}</p>
        <p className="text-xs text-zinc-500">
          {new Date(event.starts_at).toLocaleString()}
        </p>
      </div>

      <div className="mt-6 flex justify-center">
        <QrCodeDisplay confirmationCode={order.confirmation_code} />
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-zinc-500">Confirmation Code</p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-widest">
          {order.confirmation_code}
        </p>
      </div>

      <div className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-sm font-semibold">Order Details</h2>
        <div className="mt-2 space-y-1 text-sm">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between"
            >
              <span>
                {item.quantity}x Ticket
              </span>
              <span className="text-zinc-500">
                {item.unit_price_cents === 0
                  ? "Free"
                  : `$${((item.unit_price_cents * item.quantity) / 100).toFixed(2)}`}
              </span>
            </div>
          ))}
          <div className="border-t border-zinc-200 pt-1 dark:border-zinc-800">
            <div className="flex items-center justify-between font-medium">
              <span>Total</span>
              <span>
                {order.total_cents === 0
                  ? "Free"
                  : `$${(order.total_cents / 100).toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-zinc-500">
        Show this QR code at the event for check-in.
      </p>
    </main>
  );
}
