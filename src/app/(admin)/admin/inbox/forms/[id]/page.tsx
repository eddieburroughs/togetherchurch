import { checkRouteFeature } from "@/lib/features";
import { getSubmission } from "@/features/forms/server/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DeleteSubmissionButton } from "./delete-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SubmissionDetailPage({ params }: Props) {
  await checkRouteFeature("core.forms");

  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission) notFound();

  const fields = submission.form_schema?.fields ?? [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/admin/inbox/forms"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Inbox
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {submission.form_title ?? "Form"} Submission
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {new Date(submission.created_at).toLocaleString()}
          </p>
        </div>
        <DeleteSubmissionButton submissionId={id} />
      </div>

      <div className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
        <dl className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {fields.map((field) => {
            const value = submission.payload[field.name];
            const display =
              field.type === "checkbox"
                ? value
                  ? "Yes"
                  : "No"
                : String(value ?? "—");

            return (
              <div
                key={field.name}
                className="px-4 py-3"
              >
                <dt className="text-xs font-medium text-zinc-500">
                  {field.label}
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm">
                  {display}
                </dd>
              </div>
            );
          })}
          {fields.length === 0 && (
            <div className="px-4 py-3">
              <dt className="text-xs font-medium text-zinc-500">Raw Data</dt>
              <dd className="mt-1 text-sm">
                <pre className="whitespace-pre-wrap text-xs">
                  {JSON.stringify(submission.payload, null, 2)}
                </pre>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </main>
  );
}
