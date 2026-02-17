import { checkRouteFeature } from "@/lib/features";
import { NewPersonForm } from "./new-person-form";

export default async function NewPersonPage() {
  await checkRouteFeature("core.people");

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Add Person</h1>
      <NewPersonForm />
    </main>
  );
}
