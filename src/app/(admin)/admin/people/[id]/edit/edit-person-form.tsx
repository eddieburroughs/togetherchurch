"use client";

import { useActionState } from "react";
import { updatePerson } from "@/features/people/server/actions";
import { CampusSelect } from "@/features/campuses/components/campus-select";

interface Campus {
  id: string;
  name: string;
  isDefault: boolean;
}

interface PersonData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  householdId: string;
  campusId: string;
}

export function EditPersonForm({
  person,
  currentTagIds,
  campuses,
  campusMode,
  households,
  tags,
}: {
  person: PersonData;
  currentTagIds: string[];
  campuses: Campus[];
  campusMode: "off" | "optional" | "required";
  households: { id: string; name: string }[];
  tags: { id: string; name: string }[];
}) {
  const [error, formAction, pending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await updatePerson(person.id, formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Something went wrong.";
      }
    },
    null,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            First Name
          </label>
          <input id="first_name" name="first_name" type="text" required defaultValue={person.firstName}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </div>
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Last Name
          </label>
          <input id="last_name" name="last_name" type="text" required defaultValue={person.lastName}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
        <input id="email" name="email" type="email" defaultValue={person.email}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Phone</label>
        <input id="phone" name="phone" type="tel" defaultValue={person.phone}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
        <select id="status" name="status" defaultValue={person.status}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <CampusSelect campuses={campuses} campusMode={campusMode} defaultValue={person.campusId} />

      {households.length > 0 && (
        <div>
          <label htmlFor="household_id" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Household
          </label>
          <select id="household_id" name="household_id" defaultValue={person.householdId}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            <option value="">— None —</option>
            {households.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      )}

      {tags.length > 0 && (
        <fieldset>
          <legend className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tags</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t) => (
              <label key={t.id} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-3 py-1 text-sm cursor-pointer hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">
                <input
                  type="checkbox"
                  name="tag_ids"
                  value={t.id}
                  defaultChecked={currentTagIds.includes(t.id)}
                  className="rounded border-zinc-300 dark:border-zinc-600"
                />
                {t.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <button type="submit" disabled={pending}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
        {pending ? "Saving..." : "Save Changes"}
      </button>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">{error}</p>
      )}
    </form>
  );
}
