"use client";

import { useActionState } from "react";
import { submitForm } from "@/features/forms/server/actions";
import type { FormField } from "@/features/forms/server/queries";

export function FormClient({
  formKey,
  fields,
}: {
  formKey: string;
  fields: FormField[];
}) {
  const [result, formAction, pending] = useActionState(
    async (_prev: { error: string | null; success: boolean }, formData: FormData) => {
      try {
        const payload: Record<string, string | boolean> = {};
        for (const field of fields) {
          if (field.type === "checkbox") {
            payload[field.name] = formData.get(field.name) === "on";
          } else {
            payload[field.name] = (formData.get(field.name) as string) ?? "";
          }
        }
        await submitForm(formKey, payload);
        return { error: null, success: true };
      } catch (e) {
        return {
          error: e instanceof Error ? e.message : "Something went wrong.",
          success: false,
        };
      }
    },
    { error: null, success: false },
  );

  if (result.success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950">
        <p className="text-sm font-medium text-green-800 dark:text-green-300">
          Thank you! Your response has been submitted.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          {field.type === "checkbox" ? (
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <input
                name={field.name}
                type="checkbox"
                className="rounded border-zinc-300"
              />
              {field.label}
            </label>
          ) : (
            <>
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                {field.label}
                {field.required && <span className="text-red-500"> *</span>}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  id={field.name}
                  name={field.name}
                  rows={4}
                  required={field.required}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              ) : (
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  required={field.required}
                  className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              )}
            </>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "Submitting..." : "Submit"}
      </button>

      {result.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
          {result.error}
        </p>
      )}
    </form>
  );
}
