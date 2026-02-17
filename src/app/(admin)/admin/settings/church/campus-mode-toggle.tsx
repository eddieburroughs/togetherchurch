"use client";

import { useActionState } from "react";
import { updateCampusMode } from "@/features/campuses/server/actions";

const modes = [
  { value: "off", label: "Off", description: "No campuses — everything is church-wide." },
  { value: "optional", label: "Optional", description: "Campus can be selected but isn't required." },
  { value: "required", label: "Required", description: "Campus must be selected on all records." },
] as const;

export function CampusModeToggle({
  currentMode,
}: {
  currentMode: "off" | "optional" | "required";
}) {
  const [error, formAction, pending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      const mode = formData.get("campus_mode") as "off" | "optional" | "required";
      try {
        await updateCampusMode(mode);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Failed";
      }
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        {modes.map((m) => (
          <label
            key={m.value}
            className="flex items-start gap-3 rounded-lg border border-zinc-200 p-3 cursor-pointer hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
          >
            <input
              type="radio"
              name="campus_mode"
              value={m.value}
              defaultChecked={m.value === currentMode}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium">{m.label}</p>
              <p className="text-xs text-zinc-500">{m.description}</p>
            </div>
          </label>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "Saving..." : "Save Campus Mode"}
      </button>
    </form>
  );
}
