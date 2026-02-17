"use client";

import { useActionState, useState } from "react";
import { createAnnouncement } from "@/features/announcements/server/actions";
import { CampusSelect } from "@/features/campuses/components/campus-select";

interface Campus {
  id: string;
  name: string;
  isDefault: boolean;
}

export function AnnouncementForm({
  campuses,
  campusMode,
}: {
  campuses: Campus[];
  campusMode: "off" | "optional" | "required";
}) {
  const [publishOption, setPublishOption] = useState("now");

  const [error, formAction, pending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await createAnnouncement(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Something went wrong.";
      }
    },
    null,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
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
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <CampusSelect campuses={campuses} campusMode={campusMode} />

      <fieldset>
        <legend className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Publish
        </legend>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="publish_option"
              value="now"
              checked={publishOption === "now"}
              onChange={() => setPublishOption("now")}
              className="border-zinc-300 dark:border-zinc-600"
            />
            Publish now
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
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending
          ? "Saving..."
          : publishOption === "draft"
            ? "Save Draft"
            : publishOption === "schedule"
              ? "Schedule"
              : "Publish"}
      </button>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}
