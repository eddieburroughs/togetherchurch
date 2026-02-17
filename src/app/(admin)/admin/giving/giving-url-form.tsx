"use client";

import { useActionState } from "react";
import { updateGivingUrl } from "@/features/giving/server/actions";

export function GivingUrlForm({ currentUrl }: { currentUrl: string }) {
  const [error, formAction, pending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await updateGivingUrl(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Something went wrong.";
      }
    },
    null,
  );

  return (
    <form action={formAction} className="mt-3 flex gap-2">
      <input
        name="giving_url"
        type="url"
        placeholder="https://tithe.ly/give?c=..."
        defaultValue={currentUrl}
        className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "Saving..." : "Save"}
      </button>
      {error && (
        <p className="self-center text-xs text-red-600">{error}</p>
      )}
    </form>
  );
}
