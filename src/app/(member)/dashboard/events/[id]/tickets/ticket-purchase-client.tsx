"use client";

import { useState, useActionState } from "react";
import { placeOrderFree } from "@/features/tickets/server/actions";
import { useRouter } from "next/navigation";

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  capacity: number | null;
}

export function TicketPurchaseClient({
  eventId,
  ticketTypes,
}: {
  eventId: string;
  ticketTypes: TicketType[];
}) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const tt of ticketTypes) {
      init[tt.id] = 0;
    }
    return init;
  });

  const hasPaidItems = ticketTypes.some(
    (tt) => tt.priceCents > 0 && (quantities[tt.id] ?? 0) > 0,
  );

  const totalCents = ticketTypes.reduce(
    (sum, tt) => sum + tt.priceCents * (quantities[tt.id] ?? 0),
    0,
  );

  const hasItems = Object.values(quantities).some((q) => q > 0);

  const [error, formAction, pending] = useActionState(
    async (_prev: string | null) => {
      const items = Object.entries(quantities)
        .filter(([, q]) => q > 0)
        .map(([ticketTypeId, quantity]) => ({ ticketTypeId, quantity }));

      if (items.length === 0) return "Select at least one ticket.";

      if (hasPaidItems) {
        return "Paid ticket checkout requires Stripe integration. Contact the church for assistance.";
      }

      try {
        const result = await placeOrderFree(eventId, items);
        router.push(
          `/dashboard/events/${eventId}/tickets/confirmation?order=${result.orderId}`,
        );
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Failed";
      }
    },
    null,
  );

  return (
    <div className="mt-6 space-y-4">
      <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {ticketTypes.map((tt) => (
          <div
            key={tt.id}
            className="flex items-center justify-between px-4 py-4"
          >
            <div>
              <p className="text-sm font-medium">{tt.name}</p>
              {tt.description && (
                <p className="text-xs text-zinc-500">{tt.description}</p>
              )}
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {tt.priceCents === 0
                  ? "Free"
                  : `$${(tt.priceCents / 100).toFixed(2)}`}
                {tt.capacity !== null && (
                  <span className="ml-2 text-zinc-500">
                    {tt.capacity} spots
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setQuantities((q) => ({
                    ...q,
                    [tt.id]: Math.max(0, (q[tt.id] ?? 0) - 1),
                  }))
                }
                disabled={(quantities[tt.id] ?? 0) === 0}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-sm font-medium disabled:opacity-30 dark:border-zinc-700"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-medium">
                {quantities[tt.id] ?? 0}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantities((q) => ({
                    ...q,
                    [tt.id]: (q[tt.id] ?? 0) + 1,
                  }))
                }
                className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 text-sm font-medium dark:border-zinc-700"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {hasItems && (
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Total</span>
            <span>
              {totalCents === 0
                ? "Free"
                : `$${(totalCents / 100).toFixed(2)}`}
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <form action={formAction}>
        <button
          type="submit"
          disabled={pending || !hasItems}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending
            ? "Processing..."
            : hasPaidItems
              ? `Pay $${(totalCents / 100).toFixed(2)}`
              : "Register (Free)"}
        </button>
      </form>
    </div>
  );
}
