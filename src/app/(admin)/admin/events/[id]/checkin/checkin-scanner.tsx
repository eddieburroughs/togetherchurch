"use client";

import { useState, useActionState } from "react";
import { checkInByConfirmationCode } from "@/features/tickets/server/actions";

export function CheckinScanner({ eventId }: { eventId: string }) {
  const [code, setCode] = useState("");
  const [lastResult, setLastResult] = useState<string | null>(null);

  const [error, formAction, pending] = useActionState(
    async (_prev: string | null) => {
      if (!code.trim()) return "Enter a confirmation code.";
      try {
        await checkInByConfirmationCode(eventId, code.trim());
        setLastResult(code.trim().toUpperCase());
        setCode("");
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Failed";
      }
    },
    null,
  );

  return (
    <div>
      {lastResult && (
        <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950">
          <p className="text-sm text-green-800 dark:text-green-300">
            Checked in!
          </p>
          <p className="mt-1 font-mono text-xl font-bold tracking-widest text-green-900 dark:text-green-200">
            {lastResult}
          </p>
          <button
            onClick={() => setLastResult(null)}
            className="mt-2 text-xs text-green-600 underline dark:text-green-400"
          >
            Dismiss
          </button>
        </div>
      )}

      <form action={formAction} className="flex gap-2">
        <input
          type="text"
          placeholder="Confirmation code..."
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={8}
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm uppercase tracking-widest shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          autoFocus
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending ? "..." : "Check In"}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
