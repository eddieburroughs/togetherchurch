"use client";

import { useActionState, useState } from "react";
import { updateAnnouncement, deleteAnnouncement } from "@/features/announcements/server/actions";
import { CampusSelect } from "@/features/campuses/components/campus-select";
import { useRouter } from "next/navigation";

interface Campus {
  id: string;
  name: string;
  isDefault: boolean;
}

interface AnnouncementData {
  id: string;
  title: string;
  body: string;
  campusId: string;
  publishAt: string;
  isPublished: boolean;
}

function getInitialOption(a: AnnouncementData): string {
  if (!a.isPublished) return "draft";
  if (a.publishAt && new Date(a.publishAt) > new Date()) return "schedule";
  return "published";
}

export function EditAnnouncementForm({
  announcement,
  campuses,
  campusMode,
}: {
  announcement: AnnouncementData;
  campuses: Campus[];
  campusMode: "off" | "optional" | "required";
}) {
  const router = useRouter();
  const initialOption = getInitialOption(announcement);
  const [publishOption, setPublishOption] = useState(initialOption);
  const [deleting, setDeleting] = useState(false);

  const [error, formAction, pending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await updateAnnouncement(announcement.id, formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Something went wrong.";
      }
    },
    null,
  );

  async function handleDelete() {
    if (!confirm("Delete this announcement?")) return;
    setDeleting(true);
    try {
      await deleteAnnouncement(announcement.id);
      router.push("/admin/announcements");
    } catch {
      setDeleting(false);
    }
  }

  // Format datetime-local value
  const publishAtLocal = announcement.publishAt
    ? new Date(announcement.publishAt).toISOString().slice(0, 16)
    : "";

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="current_publish_at" value={announcement.publishAt} />

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={announcement.title}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div>
        <label
          htmlFor="body"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Body
        </label>
        <textarea
          id="body"
          name="body"
          rows={5}
          defaultValue={announcement.body}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <CampusSelect
        campuses={campuses}
        campusMode={campusMode}
        defaultValue={announcement.campusId}
      />

      <fieldset>
        <legend className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Publish
        </legend>
        <div className="mt-2 space-y-2">
          {initialOption === "published" && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="publish_option"
                value="published"
                checked={publishOption === "published"}
                onChange={() => setPublishOption("published")}
                className="border-zinc-300 dark:border-zinc-600"
              />
              Keep published
            </label>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="publish_option"
              value="now"
              checked={publishOption === "now"}
              onChange={() => setPublishOption("now")}
              className="border-zinc-300 dark:border-zinc-600"
            />
            {initialOption === "published" ? "Re-publish now" : "Publish now"}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="publish_option"
              value="schedule"
              checked={publishOption === "schedule"}
              onChange={() => setPublishOption("schedule")}
              className="border-zinc-300 dark:border-zinc-600"
            />
            Schedule for later
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="publish_option"
              value="draft"
              checked={publishOption === "draft"}
              onChange={() => setPublishOption("draft")}
              className="border-zinc-300 dark:border-zinc-600"
            />
            Save as draft
          </label>
        </div>
      </fieldset>

      {publishOption === "schedule" && (
        <div>
          <label
            htmlFor="publish_at"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Publish Date & Time
          </label>
          <input
            id="publish_at"
            name="publish_at"
            type="datetime-local"
            required
            defaultValue={publishAtLocal}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}
