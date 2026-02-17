import { checkRouteFeature } from "@/lib/features";
import { KidForm } from "../kid-form";

export default async function NewKidPage() {
  await checkRouteFeature("services.kids_checkin");

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Add Child</h1>
      <KidForm />
    </main>
  );
}
