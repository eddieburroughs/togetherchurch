import { checkRouteFeature } from "@/lib/features";
import { getTemplate } from "@/features/messaging/server/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EditTemplateForm } from "./edit-template-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditTemplatePage({ params }: Props) {
  await checkRouteFeature("core.messaging_sms");

  const { id } = await params;
  const template = await getTemplate(id);
  if (!template) notFound();

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/admin/messaging/templates"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Templates
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Edit Template
      </h1>
      <EditTemplateForm template={template} />
    </main>
  );
}
