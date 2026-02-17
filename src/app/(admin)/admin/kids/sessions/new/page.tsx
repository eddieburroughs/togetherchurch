import { checkRouteFeature } from "@/lib/features";
import { listCampuses, getCampusMode } from "@/features/campuses/server/queries";
import { SessionForm } from "../session-form";

export default async function NewSessionPage() {
  await checkRouteFeature("services.kids_checkin");

  const [campuses, campusMode] = await Promise.all([
    listCampuses(),
    getCampusMode(),
  ]);

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">New Session</h1>
      <SessionForm
        campuses={campuses.map((c) => ({ id: c.id, name: c.name, isDefault: c.is_default }))}
        campusMode={campusMode}
      />
    </main>
  );
}
