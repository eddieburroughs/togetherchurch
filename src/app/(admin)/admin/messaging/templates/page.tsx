import { checkRouteFeature } from "@/lib/features";
import { listTemplates } from "@/features/messaging/server/queries";
import Link from "next/link";
import { TemplateForm } from "./template-form";

export default async function TemplatesPage() {
  await checkRouteFeature("core.messaging_sms");

  const templates = await listTemplates();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
        &larr; Admin
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Message Templates
      </h1>

      <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {templates.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{t.name}</p>
              <p className="text-xs text-zinc-500">
                {t.channel.toUpperCase()} &middot;{" "}
                {t.body.length > 60 ? t.body.slice(0, 60) + "..." : t.body}
              </p>
            </div>
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {t.channel}
            </span>
          </div>
        ))}
        {templates.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            No templates yet.
          </p>
        )}
      </div>

      <h2 className="mt-8 text-lg font-semibold">New Template</h2>
      <TemplateForm />
    </main>
  );
}
