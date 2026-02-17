import { checkRouteFeature } from "@/lib/features";
import { listCampuses, getCampusMode } from "@/features/campuses/server/queries";
import { listHouseholds, listTags } from "@/features/people/server/queries";
import { NewPersonForm } from "./new-person-form";

export default async function NewPersonPage() {
  await checkRouteFeature("core.people");

  const [campuses, campusMode, households, tags] = await Promise.all([
    listCampuses(),
    getCampusMode(),
    listHouseholds(),
    listTags(),
  ]);

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Add Person</h1>
      <NewPersonForm
        campuses={campuses.map((c) => ({ id: c.id, name: c.name, isDefault: c.is_default }))}
        campusMode={campusMode}
        households={households.map((h) => ({ id: h.id, name: h.name }))}
        tags={tags.map((t) => ({ id: t.id, name: t.name }))}
      />
    </main>
  );
}
