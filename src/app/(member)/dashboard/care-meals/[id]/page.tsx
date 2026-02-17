import { checkRouteFeature } from "@/lib/features";
import { getTrain, getTrainSlots } from "@/features/care-meals/server/queries";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { SlotClaimButton } from "./slot-claim-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MemberTrainDetailPage({ params }: Props) {
  await checkRouteFeature("engage.care_meals");

  const session = await getSessionUser();
  if (!session) redirect("/login");

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
      <Link href="/dashboard/care-meals" className="text-sm text-zinc-500 hover:underline">
        &larr; Back to Meal Trains
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{train.title}</h1>
      {train.description && (
        <p className="mt-1 text-sm text-zinc-500 whitespace-pre-wrap">{train.description}</p>
      )}
      <p className="mt-1 text-xs text-zinc-400">
        {train.start_date} — {train.end_date}
      </p>

      <div className="mt-6 space-y-4">
        {sortedDates.map((date) => (
          <div key={date}>
            <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {new Date(date + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </h3>
            <div className="mt-1 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {slotsByDate.get(date)!.map((slot) => {
                const signupCount = slot.signups?.length ?? 0;
                const isFull = signupCount >= slot.capacity;
                const myClaim = slot.signups?.find(
                  (s) => s.user_id === session.id,
                );

                return (
                  <div key={slot.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">
                          {slot.slot_label}
                        </span>
                        <span
                          className={`ml-2 text-xs ${
                            isFull
                              ? "text-red-500"
                              : "text-green-600 dark:text-green-400"
                          }`}
                        >
                          {signupCount} / {slot.capacity}
                        </span>
                      </div>
                      <SlotClaimButton
                        slotId={slot.id}
                        trainId={id}
                        isClaimed={!!myClaim}
                        isFull={isFull && !myClaim}
                      />
                    </div>
                    {slot.notes && (
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {slot.notes}
                      </p>
                    )}
                    {slot.signups && slot.signups.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {slot.signups.map((s) => (
                          <span
                            key={s.id}
                            className={`rounded px-1.5 py-0.5 text-xs ${
                              s.user_id === session.id
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                            }`}
                          >
                            {s.display_name}
                            {s.note && ` — ${s.note}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {slots.length === 0 && (
          <p className="text-sm text-zinc-500">
            No slots available yet. Check back later!
          </p>
        )}
      </div>
    </main>
  );
}
