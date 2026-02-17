import { checkRouteFeature } from "@/lib/features";
import { listCampuses, getCampusMode } from "@/features/campuses/server/queries";
import { TrainForm } from "../train-form";

export default async function NewTrainPage() {
  await checkRouteFeature("engage.care_meals");

  const [campuses, campusMode] = await Promise.all([
    listCampuses(),
    getCampusMode(),
  ]);

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Create Meal Train</h1>
      <TrainForm
        campuses={campuses.map((c) => ({ id: c.id, name: c.name, isDefault: c.is_default }))}
        campusMode={campusMode}
      />
    </main>
  );
}
