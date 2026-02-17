"use client";

import { useActionState } from "react";
import { useState } from "react";
import { updateHousehold, deleteHousehold } from "@/features/people/server/actions";
import { useRouter } from "next/navigation";

export function HouseholdDetailActions({
  householdId,
  householdName,
}: {
  householdId: string;
  householdName: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, formAction, pending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await updateHousehold(householdId, formData);
        setEditing(false);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Something went wrong.";
      }
    },
    null,
  );

  async function handleDelete() {
    if (!confirm("Delete this household? Members will be unassigned but not deleted.")) return;
    setDeleting(true);
    try {
      await deleteHousehold(householdId);
      router.push("/admin/households");
    } catch {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <form action={formAction} className="mt-4 flex gap-2">
        <input
          name="name"
          type="text"
          required
          defaultValue={householdName}
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
        {error && <p className="self-center text-sm text-red-600">{error}</p>}
      </form>
    );
  }

  return (
    <div className="mt-4 flex gap-2">
      <button
        onClick={() => setEditing(true)}
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Rename
      </button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
