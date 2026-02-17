"use client";

import { useActionState } from "react";
import { deleteTicketType } from "@/features/tickets/server/actions";

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  capacity: number | null;
  active: boolean;
  sortOrder: number;
}

export function TicketTypeList({
  eventId,
  ticketTypes,
}: {
  eventId: string;
  ticketTypes: TicketType[];
}) {
  if (ticketTypes.length === 0) {
    return (
      <p className="mt-2 text-sm text-zinc-500">
        No ticket types yet. Add one below.
      </p>
    );
  }

  return (
    <div className="mt-2 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {ticketTypes.map((tt) => (
        <TicketTypeRow key={tt.id} eventId={eventId} tt={tt} />
      ))}
    </div>
  );
}

function TicketTypeRow({
  eventId,
  tt,
}: {
  eventId: string;
  tt: TicketType;
}) {
  const [, formAction, pending] = useActionState(
    async () => {
      await deleteTicketType(tt.id, eventId);
      return null;
    },
    null,
  );

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-medium">
          {tt.name}
          {!tt.active && (
            <span className="ml-2 rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Inactive
            </span>
          )}
        </p>
        <p className="text-xs text-zinc-500">
          {tt.priceCents === 0
            ? "Free"
            : `$${(tt.priceCents / 100).toFixed(2)}`}
          {tt.capacity !== null && ` · ${tt.capacity} capacity`}
          {tt.description && ` · ${tt.description}`}
        </p>
      </div>
      <form action={formAction}>
        <button
          type="submit"
          disabled={pending}
          className="text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
        >
          {pending ? "..." : "Delete"}
        </button>
      </form>
    </div>
  );
}
