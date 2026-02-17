import { checkRouteFeature } from "@/lib/features";
import { SessionForm } from "../session-form";

export default async function NewSessionPage() {
  await checkRouteFeature("services.kids_checkin");

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">New Session</h1>
      <SessionForm />
    </main>
  );
}
