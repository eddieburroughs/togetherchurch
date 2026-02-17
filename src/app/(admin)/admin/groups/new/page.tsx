import { checkRouteFeature } from "@/lib/features";
import { listCampuses, getCampusMode } from "@/features/campuses/server/queries";
import { GroupForm } from "../group-form";

export default async function NewGroupPage() {
  await checkRouteFeature("engage.groups");

  const [campuses, campusMode] = await Promise.all([
    listCampuses(),
    getCampusMode(),
  ]);

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Create Group</h1>
      <GroupForm
        campuses={campuses.map((c) => ({ id: c.id, name: c.name, isDefault: c.is_default }))}
        campusMode={campusMode}
      />
    </main>
  );
}
