import { checkRouteFeature } from "@/lib/features";
import {
  getSession,
  getSessionCheckins,
  listKids,
} from "@/features/kids/server/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckInStation } from "./checkin-station";
import { CheckOutButton } from "./checkout-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminSessionDetailPage({ params }: Props) {
  await checkRouteFeature("services.kids_checkin");

  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();

  const checkins = await getSessionCheckins(id);
  const { data: allKids } = await listKids({ limit: 500 });

  // Kids not yet checked in to this session
  const checkedInKidIds = new Set(
    checkins.filter((c) => !c.checked_out_at).map((c) => c.kid_id),
  );
  const availableKids = allKids.filter((k) => !checkedInKidIds.has(k.id));

  const activeCheckins = checkins.filter((c) => !c.checked_out_at);
  const completedCheckins = checkins.filter((c) => c.checked_out_at);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/admin/kids/sessions"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Sessions
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{session.name}</h1>
          <p className="text-sm text-zinc-500">
            {new Date(session.starts_at).toLocaleString()}
          </p>
        </div>
        {activeCheckins.length > 0 && (
          <Link
            href={`/admin/kids/sessions/${id}/print-labels`}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Print Labels
          </Link>
        )}
      </div>

      {/* Check-in station */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold">Check In</h2>
        <CheckInStation
          sessionId={id}
          availableKids={availableKids.map((k) => ({
            id: k.id,
            name: `${k.first_name} ${k.last_name}`,
            allergies: k.allergies,
          }))}
        />
      </div>

      {/* Active check-ins */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold">
          Checked In ({activeCheckins.length})
        </h2>
        <div className="mt-2 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {activeCheckins.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {c.kid_first_name} {c.kid_last_name}
                </p>
                <p className="text-xs text-zinc-500">
                  Code: <span className="font-mono font-bold">{c.pickup_code}</span>
                  {c.kid_allergies && (
                    <span className="ml-2 text-red-500">
                      Allergies: {c.kid_allergies}
                    </span>
                  )}
                </p>
              </div>
              <CheckOutButton checkinId={c.id} />
            </div>
          ))}
          {activeCheckins.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              No kids checked in.
            </p>
          )}
        </div>
      </div>

      {/* Completed check-outs */}
      {completedCheckins.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">
            Checked Out ({completedCheckins.length})
          </h2>
          <div className="mt-2 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {completedCheckins.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-4 py-2 text-sm text-zinc-500"
              >
                <span>
                  {c.kid_first_name} {c.kid_last_name}
                </span>
                <span className="text-xs">
                  Out: {new Date(c.checked_out_at!).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
