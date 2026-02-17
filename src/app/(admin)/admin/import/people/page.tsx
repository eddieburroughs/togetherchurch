import { checkRouteFeature } from "@/lib/features";
import { ImportWizard } from "./import-wizard";
import Link from "next/link";

export default async function ImportPeoplePage() {
  await checkRouteFeature("core.people");

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Import People</h1>
        <Link
          href="/admin/import/help"
          className="text-sm text-zinc-500 hover:underline"
        >
          Export recipes &rarr;
        </Link>
      </div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Upload a CSV file to import your congregation. Duplicates are detected
        by email or phone.
      </p>
      <ImportWizard />
    </main>
  );
}
