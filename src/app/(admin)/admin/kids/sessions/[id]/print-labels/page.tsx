import { checkRouteFeature } from "@/lib/features";
import {
  getSession,
  getSessionCheckins,
  listLabelTemplates,
} from "@/features/kids/server/queries";
import { seedLabelTemplates } from "@/features/kids/server/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PrintLabelsClient } from "./print-labels-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PrintLabelsPage({ params }: Props) {
  await checkRouteFeature("services.kids_checkin.labels");

  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();

  // Ensure default templates exist
  await seedLabelTemplates();

  const checkins = await getSessionCheckins(id);
  const activeCheckins = checkins.filter((c) => !c.checked_out_at);
  const templates = await listLabelTemplates();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href={`/admin/kids/sessions/${id}`}
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Session
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Print Labels — {session.name}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        {activeCheckins.length} checked-in kid
        {activeCheckins.length !== 1 ? "s" : ""}
      </p>

      {activeCheckins.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">
          No kids currently checked in.
        </p>
      ) : (
        <PrintLabelsClient
          sessionId={id}
          sessionName={session.name}
          sessionDate={new Date(session.starts_at).toLocaleDateString()}
          templates={templates.map((t) => ({
            id: t.id,
            key: t.key,
            name: t.name,
            widthMm: t.width_mm,
            heightMm: t.height_mm,
            layout: t.layout as { fields: { key: string; x: number; y: number; fontSize: number; bold?: boolean }[] },
          }))}
          checkins={activeCheckins.map((c) => ({
            childName: `${c.kid_first_name} ${c.kid_last_name}`,
            pickupCode: c.pickup_code,
            allergies: c.kid_allergies ?? null,
          }))}
        />
      )}
    </main>
  );
}
