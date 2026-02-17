"use client";

import { useState } from "react";
import { deleteTemplate } from "@/features/messaging/server/actions";
import { useRouter } from "next/navigation";

export function TemplateDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this template?")) return;
    setDeleting(true);
    try {
      await deleteTemplate(id);
      router.refresh();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {deleting ? "..." : "Delete"}
    </button>
  );
}
