import { checkRouteFeature } from "@/lib/features";
import { getEvent } from "@/features/events/server/queries";
import {
  listEventOrders,
  getEventCheckins,
} from "@/features/tickets/server/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckinScanner } from "./checkin-scanner";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminCheckinPage({ params }: Props) {
  await checkRouteFeature("engage.events.tickets");

  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const [orders, checkins] = await Promise.all([
    listEventOrders(id),
    getEventCheckins(id),
  ]);

  const completedOrders = orders.filter((o) => o.status === "completed");
  const checkedInOrderIds = new Set(checkins.map((c) => c.order_id));

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/admin/events/${id}/tickets`}
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Tickets
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Check-in — {event.title}
      </h1>

      <div className="mt-2 flex gap-4 text-sm">
        <span className="text-green-700 dark:text-green-400">
          Checked in: {checkins.length}
        </span>
        <span className="text-zinc-500">
          Total orders: {completedOrders.length}
        </span>
      </div>

      <div className="mt-6">
        <CheckinScanner eventId={id} />
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Order List</h2>
        <div className="mt-2 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {completedOrders.map((o) => {
            const isCheckedIn = checkedInOrderIds.has(o.id);
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
                    {o.total_cents === 0
                      ? "Free"
                      : `$${(o.total_cents / 100).toFixed(2)}`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    isCheckedIn
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {isCheckedIn ? "Checked In" : "Not Checked In"}
                </span>
              </div>
            );
          })}
          {completedOrders.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              No completed orders.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
