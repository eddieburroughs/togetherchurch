"use client";

import { useState, useActionState } from "react";
import { checkInKid } from "@/features/kids/server/actions";

interface Kid {
  id: string;
  name: string;
  allergies: string | null;
}

export function CheckInStation({
  sessionId,
  availableKids,
}: {
  sessionId: string;
  availableKids: Kid[];
}) {
  const [search, setSearch] = useState("");
  const [lastCode, setLastCode] = useState<string | null>(null);

  const filtered = search
    ? availableKids.filter((k) =>
        k.name.toLowerCase().includes(search.toLowerCase()),
      )
    : availableKids;

  const [error, formAction, pending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      const kidId = formData.get("kid_id") as string;
      if (!kidId) return "Please select a child.";
      try {
        const result = await checkInKid(sessionId, kidId);
        setLastCode(result.pickupCode);
        setSearch("");
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Failed";
      }
    },
    null,
  );

  return (
    <div className="mt-2">
      {lastCode && (
        <div className="mb-3 rounded-lg border border-green-200 bg-green-50 p-4 text-center dark:border-green-800 dark:bg-green-950">
          <p className="text-sm text-green-800 dark:text-green-300">
            Checked in! Pickup code:
          </p>
          <p className="mt-1 text-3xl font-bold tracking-widest text-green-900 dark:text-green-200">
            {lastCode}
          </p>
          <button
            onClick={() => setLastCode(null)}
            className="mt-2 text-xs text-green-600 underline dark:text-green-400"
          >
            Dismiss
          </button>
        </div>
      )}

      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />

      <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {filtered.map((kid) => (
          <form key={kid.id} action={formAction}>
            <input type="hidden" name="kid_id" value={kid.id} />
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-zinc-50 disabled:opacity-50 dark:hover:bg-zinc-900/50"
            >
              <div>
                <span className="text-sm font-medium">{kid.name}</span>
                {kid.allergies && (
                  <span className="ml-2 rounded bg-red-100 px-1 py-0.5 text-xs text-red-700 dark:bg-red-900 dark:text-red-300">
                    {kid.allergies}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-zinc-500">
                Check In
              </span>
            </button>
          </form>
        ))}
        {filtered.length === 0 && (
          <p className="px-4 py-4 text-center text-sm text-zinc-500">
            {availableKids.length === 0
              ? "All kids are checked in."
              : "No matching kids."}
          </p>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
