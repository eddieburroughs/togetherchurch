import { checkRouteFeature } from "@/lib/features";
import { getEvent } from "@/features/events/server/queries";
import { listEventOrders } from "@/features/tickets/server/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { RefundButton } from "./refund-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrdersPage({ params }: Props) {
  await checkRouteFeature("engage.events.tickets");

  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const orders = await listEventOrders(id);

  const statusColors: Record<string, string> = {
    completed: "text-green-600 dark:text-green-400",
    pending: "text-amber-600 dark:text-amber-400",
    cancelled: "text-red-600 dark:text-red-400",
    refunded: "text-zinc-500 dark:text-zinc-400",
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/admin/events/${id}/tickets`}
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Tickets
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Orders — {event.title}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {orders.length} order{orders.length !== 1 ? "s" : ""}
      </p>

      <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {orders.map((o) => {
          const amount =
            o.total_cents === 0
              ? "Free"
              : `$${(o.total_cents / 100).toFixed(2)}`;

          return (
            <div
              key={o.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="font-mono text-sm font-bold">
                  {o.confirmation_code}
                </p>
                <p className="text-xs text-zinc-500">
                  {new Date(o.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">{amount}</p>
                  <span
                    className={`text-xs font-medium ${statusColors[o.status] ?? ""}`}
                  >
                    {o.status}
                  </span>
                </div>
                {o.status === "completed" && (
                  <RefundButton orderId={o.id} amount={amount} />
                )}
              </div>
            </div>
          );
        })}
        {orders.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-zinc-500">
            No orders yet.
          </p>
        )}
      </div>
    </main>
  );
}
