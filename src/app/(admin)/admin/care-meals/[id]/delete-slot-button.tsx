"use client";

import { useActionState } from "react";
import { deleteSlot } from "@/features/care-meals/server/actions";

export function DeleteSlotButton({
  slotId,
  trainId,
}: {
  slotId: string;
  trainId: string;
}) {
  const [error, formAction, pending] = useActionState(
    async (_prev: string | null) => {
      try {
        await deleteSlot(slotId, trainId);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Failed";
      }
    },
    null,
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
      >
        {pending ? "..." : "Remove"}
      </button>
      {error && <span className="ml-1 text-xs text-red-500">{error}</span>}
    </form>
  );
}
