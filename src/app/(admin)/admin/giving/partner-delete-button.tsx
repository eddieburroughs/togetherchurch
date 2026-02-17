"use client";

import { useState } from "react";
import { deleteGivingPartner } from "@/features/giving/server/actions";
import { useRouter } from "next/navigation";

export function PartnerDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this partner?")) return;
    setDeleting(true);
    try {
      await deleteGivingPartner(id);
      router.refresh();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="shrink-0 text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
    >
      {deleting ? "..." : "Delete"}
    </button>
  );
}
