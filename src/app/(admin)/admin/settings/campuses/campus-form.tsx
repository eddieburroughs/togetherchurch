"use client";

import { useActionState } from "react";
import { createCampus } from "@/features/campuses/server/actions";

export function CampusForm() {
  const [error, formAction, pending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await createCampus(formData);
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
          htmlFor="campus-name"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Campus Name
        </label>
        <input
          id="campus-name"
          name="name"
          type="text"
          required
          placeholder="e.g. Downtown Campus"
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        <input name="is_default" type="checkbox" className="rounded border-zinc-300" />
        Default Campus
      </label>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "Adding..." : "Add Campus"}
      </button>
    </form>
  );
}
