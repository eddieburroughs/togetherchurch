import { checkRouteFeature } from "@/lib/features";
import { getEvent } from "@/features/events/server/queries";
import { listEventOrders } from "@/features/tickets/server/queries";
import { notFound } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrdersPage({ params }: Props) {
  await checkRouteFeature("engage.events.tickets");

  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const orders = await listEventOrders(id);

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
        {orders.map((o) => (
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
            <div className="text-right">
              <p className="text-sm font-medium">
                {o.total_cents === 0
                  ? "Free"
                  : `$${(o.total_cents / 100).toFixed(2)}`}
              </p>
              <span
                className={`text-xs font-medium ${
                  o.status === "completed"
                    ? "text-green-600 dark:text-green-400"
                    : o.status === "pending"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-red-600 dark:text-red-400"
                }`}
              >
                {o.status}
              </span>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-zinc-500">
            No orders yet.
          </p>
        )}
      </div>
    </main>
  );
}
