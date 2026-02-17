import { checkRouteFeature } from "@/lib/features";
import { getTrain, getTrainSlots } from "@/features/care-meals/server/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SlotForm } from "./slot-form";
import { DeleteSlotButton } from "./delete-slot-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminTrainDetailPage({ params }: Props) {
  await checkRouteFeature("engage.care_meals");

  const { id } = await params;
  const train = await getTrain(id);
  if (!train) notFound();

  const slots = await getTrainSlots(id);

  // Group slots by date
  const slotsByDate = new Map<string, typeof slots>();
  for (const slot of slots) {
    const list = slotsByDate.get(slot.slot_date) ?? [];
    list.push(slot);
    slotsByDate.set(slot.slot_date, list);
  }

  const sortedDates = [...slotsByDate.keys()].sort();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin/care-meals" className="text-sm text-zinc-500 hover:underline">
        &larr; Back to Meal Trains
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{train.title}</h1>
      {train.description && (
        <p className="mt-1 text-sm text-zinc-500 whitespace-pre-wrap">{train.description}</p>
      )}
      <p className="mt-1 text-xs text-zinc-400">
        {train.start_date} — {train.end_date}
      </p>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Slots</h2>

        {sortedDates.map((date) => (
          <div key={date} className="mt-4">
            <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {new Date(date + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </h3>
            <div className="mt-1 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {slotsByDate.get(date)!.map((slot) => (
                <div key={slot.id} className="px-4 py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{slot.slot_label}</span>
                      <span className="ml-2 text-xs text-zinc-500">
                        {slot.signups?.length ?? 0} / {slot.capacity} claimed
                      </span>
                    </div>
                    <DeleteSlotButton slotId={slot.id} trainId={id} />
                  </div>
                  {slot.notes && (
                    <p className="mt-0.5 text-xs text-zinc-400">{slot.notes}</p>
                  )}
                  {slot.signups && slot.signups.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {slot.signups.map((s) => (
                        <span
                          key={s.id}
                          className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-800 dark:bg-green-900 dark:text-green-300"
                        >
                          {s.display_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {slots.length === 0 && (
          <p className="mt-2 text-sm text-zinc-500">No slots yet. Add one below.</p>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Add Slot</h2>
        <SlotForm trainId={id} startDate={train.start_date} endDate={train.end_date} />
      </div>
    </main>
  );
}
