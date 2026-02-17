import { checkRouteFeature } from "@/lib/features";
import { GroupForm } from "../group-form";

export default async function NewGroupPage() {
  await checkRouteFeature("engage.groups");

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Create Group</h1>
      <GroupForm />
    </main>
  );
}
