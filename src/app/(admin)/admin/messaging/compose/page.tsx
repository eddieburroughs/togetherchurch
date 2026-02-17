import { checkRouteFeature } from "@/lib/features";
import { listTemplates, listTags } from "@/features/messaging/server/queries";
import Link from "next/link";
import { ComposeForm } from "./compose-form";

export default async function ComposeMessagePage() {
  // Check either messaging feature — the form itself validates the specific one
  await checkRouteFeature("core.messaging_sms");

  const [templates, tags] = await Promise.all([
    listTemplates(),
    listTags(),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
        &larr; Admin
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Compose Message
      </h1>

      <div className="mt-6">
        <ComposeForm
          templates={templates.map((t) => ({
            id: t.id,
            channel: t.channel,
            name: t.name,
            body: t.body,
          }))}
          tags={tags}
        />
      </div>
    </main>
  );
}
