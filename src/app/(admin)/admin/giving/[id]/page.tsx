import { checkRouteFeature } from "@/lib/features";
import { getGivingPartner } from "@/features/giving/server/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EditPartnerForm } from "./edit-partner-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPartnerPage({ params }: Props) {
  await checkRouteFeature("core.giving");

  const { id } = await params;
  const partner = await getGivingPartner(id);
  if (!partner) notFound();

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/admin/giving"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Giving
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Edit Partner
      </h1>
      <EditPartnerForm partner={partner} />
    </main>
  );
}
