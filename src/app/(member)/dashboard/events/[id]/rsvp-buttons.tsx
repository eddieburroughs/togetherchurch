"use client";

import { useActionState } from "react";
import { submitRsvp } from "@/features/events/server/actions";

const statuses = [
  { value: "yes" as const, label: "Going", color: "bg-green-600 text-white hover:bg-green-700" },
  { value: "maybe" as const, label: "Maybe", color: "bg-amber-500 text-white hover:bg-amber-600" },
  { value: "no" as const, label: "Can't Go", color: "bg-red-600 text-white hover:bg-red-700" },
];

const activeColors: Record<string, string> = {
  yes: "ring-2 ring-green-500 ring-offset-2 dark:ring-offset-zinc-950",
  maybe: "ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-zinc-950",
  no: "ring-2 ring-red-500 ring-offset-2 dark:ring-offset-zinc-950",
};

export function RsvpButtons({
  eventId,
  currentStatus,
}: {
  eventId: string;
  currentStatus: string | null;
}) {
  const [error, formAction, pending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        const status = formData.get("status") as "yes" | "no" | "maybe";
        await submitRsvp(eventId, status);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Something went wrong.";
      }
    },
    null,
  );

  return (
    <div>
      <div className="flex gap-2">
        {statuses.map((s) => (
          <form key={s.value} action={formAction}>
            <input type="hidden" name="status" value={s.value} />
            <button
              type="submit"
              disabled={pending}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 ${s.color} ${
                currentStatus === s.value ? activeColors[s.value] : ""
              }`}
            >
              {s.label}
            </button>
          </form>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
