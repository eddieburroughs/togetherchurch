"use client";

import { exportRsvpsCsv } from "@/features/events/server/actions";

export function ExportRsvpButton({ eventId }: { eventId: string }) {
  async function handleExport() {
    const csv = await exportRsvpsCsv(eventId);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rsvps-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={handleExport}
      className="rounded border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
    >
      Export CSV
    </button>
  );
}
