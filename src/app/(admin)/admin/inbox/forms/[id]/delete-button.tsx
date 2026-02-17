"use client";

import { useActionState } from "react";
import { deleteSubmission } from "@/features/forms/server/actions";
import { useRouter } from "next/navigation";

export function DeleteSubmissionButton({ submissionId }: { submissionId: string }) {
  const router = useRouter();

  const [error, formAction, pending] = useActionState(
    async (_prev: string | null) => {
      try {
        if (!confirm("Delete this submission?")) return null;
        await deleteSubmission(submissionId);
        router.push("/admin/inbox/forms");
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Something went wrong.";
      }
    },
    null,
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
      >
        {pending ? "Deleting..." : "Delete"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </form>
  );
}
