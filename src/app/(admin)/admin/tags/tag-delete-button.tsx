"use client";

import { useState } from "react";
import { deleteTag } from "@/features/people/server/actions";

export function TagDeleteButton({ tagId, tagName }: { tagId: string; tagName: string }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete tag "${tagName}"? It will be removed from all people.`)) return;
    setDeleting(true);
    try {
      await deleteTag(tagId);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
    >
      {deleting ? "..." : "Delete"}
    </button>
  );
}
