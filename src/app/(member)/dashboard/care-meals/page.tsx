import { checkRouteFeature } from "@/lib/features";
import { listTrains } from "@/features/care-meals/server/queries";
import Link from "next/link";

export default async function MemberCareMealsPage() {
  await checkRouteFeature("engage.care_meals");

  const { data: trains } = await listTrains({ active: true, limit: 50 });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
        &larr; Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Meal Trains</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Sign up to bring a meal to someone in need.
      </p>

      <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {trains.map((t) => (
          <Link
            key={t.id}
            href={`/dashboard/care-meals/${t.id}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
          >
            <div>
              <p className="text-sm font-medium">{t.title}</p>
              <p className="text-xs text-zinc-500">
                {t.start_date} — {t.end_date}
              </p>
            </div>
          </Link>
        ))}
        {trains.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            No active meal trains right now.
          </p>
        )}
      </div>
    </main>
  );
}
