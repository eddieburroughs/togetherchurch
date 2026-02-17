import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { ENV } from "@/lib/env";

export default async function ImportPage() {
  if (!ENV.isConfigured) redirect("/login");

  const session = await getSessionUser();
  if (!session) redirect("/login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold tracking-tight">
          Import Your People
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Upload a CSV to import your congregation into Together Church.
        </p>

        <div className="mt-6 rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            CSV import will be available soon.
          </p>
          <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
            Supported formats: Planning Center, Breeze, Church Community Builder
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <a
            href="/admin"
            className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Go to Dashboard
          </a>
          <a
            href="/admin"
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Skip for now
          </a>
        </div>
      </div>
    </main>
  );
}
