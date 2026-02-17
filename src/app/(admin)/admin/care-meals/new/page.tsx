import { checkRouteFeature } from "@/lib/features";
import { TrainForm } from "../train-form";

export default async function NewTrainPage() {
  await checkRouteFeature("engage.care_meals");

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Create Meal Train</h1>
      <TrainForm />
    </main>
  );
}
