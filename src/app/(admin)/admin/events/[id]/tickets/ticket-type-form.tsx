"use client";

import { useActionState } from "react";
import { createTicketType } from "@/features/tickets/server/actions";

export function TicketTypeForm({
  eventId,
  stripeReady,
}: {
  eventId: string;
  stripeReady: boolean;
}) {
  const [error, formAction, pending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await createTicketType(eventId, formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Failed";
      }
    },
    null,
  );

  return (
    <form action={formAction} className="mt-2 space-y-3">
      <div>
        <label
          htmlFor="tt-name"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Name
        </label>
        <input
          id="tt-name"
          name="name"
          required
          placeholder="e.g. General Admission"
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div>
        <label
          htmlFor="tt-desc"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Description
        </label>
        <input
          id="tt-desc"
          name="description"
          placeholder="Optional description"
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label
            htmlFor="tt-price"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Price ($)
          </label>
          <input
            id="tt-price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue="0"
            disabled={!stripeReady}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          {!stripeReady && (
            <p className="mt-0.5 text-xs text-amber-600">
              Connect Stripe for paid
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="tt-cap"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Capacity
          </label>
          <input
            id="tt-cap"
            name="capacity"
            type="number"
            min="1"
            placeholder="Unlimited"
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
        <div>
          <label
            htmlFor="tt-sort"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Sort Order
          </label>
          <input
            id="tt-sort"
            name="sort_order"
            type="number"
            defaultValue="0"
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "Adding..." : "Add Ticket Type"}
      </button>
    </form>
  );
}
