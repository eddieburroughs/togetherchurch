"use client";

interface Campus {
  id: string;
  name: string;
  isDefault: boolean;
}

/**
 * Reusable campus select dropdown.
 * Only rendered when campus_mode is "optional" or "required".
 * Pass campusMode="off" and this returns null.
 */
export function CampusSelect({
  campuses,
  campusMode,
  defaultValue,
  name = "campus_id",
}: {
  campuses: Campus[];
  campusMode: "off" | "optional" | "required";
  defaultValue?: string;
  name?: string;
}) {
  if (campusMode === "off" || campuses.length === 0) return null;

  const defaultCampus = campuses.find((c) => c.isDefault);
  const initialValue = defaultValue ?? defaultCampus?.id ?? "";

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        Campus{campusMode === "required" ? " *" : ""}
      </label>
      <select
        id={name}
        name={name}
        required={campusMode === "required"}
        defaultValue={initialValue}
        className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {campusMode === "optional" && <option value="">— No Campus —</option>}
        {campuses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.isDefault ? " (Default)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
