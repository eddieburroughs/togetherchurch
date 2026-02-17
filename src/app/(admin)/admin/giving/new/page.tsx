import { checkRouteFeature } from "@/lib/features";
import Link from "next/link";
import { PartnerForm } from "./partner-form";

export default async function NewPartnerPage() {
  await checkRouteFeature("core.giving");

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/admin/giving"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Giving
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Add Giving Partner
      </h1>
      <PartnerForm />
    </main>
  );
}
