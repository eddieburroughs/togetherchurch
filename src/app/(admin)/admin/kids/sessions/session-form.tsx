"use client";

import { useActionState } from "react";
import { createSession } from "@/features/kids/server/actions";

export function SessionForm() {
  const [error, formAction, pending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await createSession(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Something went wrong.";
      }
    },
    null,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Session Name</label>
        <input id="name" name="name" type="text" required placeholder="e.g. Sunday 9am Service"
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="starts_at" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Starts</label>
          <input id="starts_at" name="starts_at" type="datetime-local" required
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </div>
        <div>
          <label htmlFor="ends_at" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Ends</label>
          <input id="ends_at" name="ends_at" type="datetime-local"
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </div>
      </div>

      <button type="submit" disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
        {pending ? "Creating..." : "Create Session"}
      </button>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">{error}</p>
      )}
    </form>
  );
}
