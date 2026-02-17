"use client";

import { useActionState } from "react";
import { updateTemplate } from "@/features/messaging/server/actions";

interface TemplateData {
  id: string;
  channel: "sms" | "email";
  name: string;
  body: string;
}

export function EditTemplateForm({ template }: { template: TemplateData }) {
  const [error, formAction, pending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await updateTemplate(template.id, formData);
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
          htmlFor="name"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={template.name}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div>
        <p className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Channel
        </p>
        <p className="mt-1 rounded bg-zinc-100 px-2 py-1 text-sm text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {template.channel.toUpperCase()}
        </p>
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
          rows={6}
          required
          defaultValue={template.body}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "Saving..." : "Save Changes"}
      </button>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}
