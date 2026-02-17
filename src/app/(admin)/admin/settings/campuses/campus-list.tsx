"use client";

import { useActionState } from "react";
import { deleteCampus } from "@/features/campuses/server/actions";

interface Campus {
  id: string;
  name: string;
  isDefault: boolean;
}

export function CampusList({ campuses }: { campuses: Campus[] }) {
  if (campuses.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No campuses yet. Add one below.
      </p>
    );
  }

  return (
    <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {campuses.map((c) => (
        <CampusRow key={c.id} campus={c} />
      ))}
    </div>
  );
}

function CampusRow({ campus }: { campus: Campus }) {
  const [, formAction, pending] = useActionState(async () => {
    await deleteCampus(campus.id);
    return null;
  }, null);

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className="text-sm font-medium">
          {campus.name}
          {campus.isDefault && (
            <span className="ml-2 rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Default
            </span>
          )}
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
