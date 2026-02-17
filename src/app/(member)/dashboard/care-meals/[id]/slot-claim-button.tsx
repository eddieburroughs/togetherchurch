"use client";

import { useActionState } from "react";
import { claimSlot, unclaimSlot } from "@/features/care-meals/server/actions";

export function SlotClaimButton({
  slotId,
  trainId,
  isClaimed,
  isFull,
}: {
  slotId: string;
  trainId: string;
  isClaimed: boolean;
  isFull: boolean;
}) {
  const [error, formAction, pending] = useActionState(
    async (_prev: string | null) => {
      try {
        if (isClaimed) {
          await unclaimSlot(slotId, trainId);
        } else {
          await claimSlot(slotId);
        }
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Failed";
      }
    },
    null,
  );

  if (isFull) {
    return (
      <span className="text-xs text-zinc-400">Full</span>
    );
  }

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
          isClaimed
            ? "border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
            : "bg-green-600 text-white hover:bg-green-700"
        }`}
      >
        {pending ? "..." : isClaimed ? "Cancel" : "Sign Up"}
      </button>
      {error && (
        <p className="mt-0.5 text-xs text-red-500">{error}</p>
      )}
    </form>
  );
}
