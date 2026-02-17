"use client";

import { useState } from "react";
import {
  publishAnnouncement,
  unpublishAnnouncement,
  deleteAnnouncement,
} from "@/features/announcements/server/actions";

export function AnnouncementAdminActions({
  announcementId,
  isPublished,
  status,
}: {
  announcementId: string;
  isPublished: boolean;
  status: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handlePublish() {
    setBusy(true);
    try {
      await publishAnnouncement(announcementId);
    } finally {
      setBusy(false);
    }
  }

  async function handleUnpublish() {
    setBusy(true);
    try {
      await unpublishAnnouncement(announcementId);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this announcement?")) return;
    setBusy(true);
    try {
      await deleteAnnouncement(announcementId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex shrink-0 gap-1">
      {status === "draft" && (
        <button
          onClick={handlePublish}
          disabled={busy}
          className="rounded px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 disabled:opacity-50 dark:text-green-400 dark:hover:bg-green-950"
        >
          Publish
        </button>
      )}
      {isPublished && status !== "scheduled" && (
        <button
          onClick={handleUnpublish}
          disabled={busy}
          className="rounded px-2 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-50 disabled:opacity-50 dark:hover:bg-zinc-800"
        >
          Unpublish
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={busy}
        className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950"
      >
        Delete
      </button>
    </div>
  );
}
