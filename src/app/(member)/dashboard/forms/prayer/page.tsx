import { checkRouteFeature } from "@/lib/features";
import { getFormByKey } from "@/features/forms/server/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FormClient } from "../form-client";

export default async function PrayerRequestPage() {
  await checkRouteFeature("core.forms");

  const form = await getFormByKey("prayer_request");
  if (!form) notFound();

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
        &larr; Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">{form.title}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Share your prayer request and our team will pray for you.
      </p>
      <div className="mt-6">
        <FormClient formKey="prayer_request" fields={form.schema.fields} />
      </div>
    </main>
  );
}
