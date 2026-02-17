import { checkRouteFeature } from "@/lib/features";
import { EventForm } from "../event-form";

export default async function NewEventPage() {
  await checkRouteFeature("core.events");

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Create Event</h1>
      <EventForm />
    </main>
  );
}
