import { checkRouteFeature } from "@/lib/features";
import Link from "next/link";

export default async function ImportHelpPage() {
  await checkRouteFeature("core.people");

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/admin/import/people"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Import
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Export Recipes
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Instructions for exporting your people from popular church management
        systems.
      </p>

      <div className="mt-6 space-y-6">
        <section>
          <h2 className="text-lg font-semibold">Planning Center</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            <li>Go to People &rarr; Lists &rarr; Everyone</li>
            <li>Click the gear icon &rarr; Export &rarr; CSV</li>
            <li>
              Select columns: First Name, Last Name, Email, Phone, Household
              Name
            </li>
            <li>Download and upload to Together Church</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Breeze ChMS</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            <li>Go to People &rarr; View All</li>
            <li>Click Export &rarr; CSV</li>
            <li>
              The default export includes First Name, Last Name, Email, Phone
            </li>
            <li>Download and upload to Together Church</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Church Community Builder (CCB)</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            <li>Go to People &rarr; Search &rarr; All People</li>
            <li>Click Actions &rarr; Export to CSV</li>
            <li>
              Map &quot;First Name&quot;, &quot;Last Name&quot;, &quot;Primary
              Email&quot;, &quot;Mobile Phone&quot;
            </li>
            <li>Download and upload to Together Church</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Subsplash</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            <li>Go to Dashboard &rarr; People</li>
            <li>Click Export</li>
            <li>Choose CSV format</li>
            <li>Download and upload to Together Church</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Generic CSV</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
            <li>
              Create a CSV with headers: <code>first_name</code>,{" "}
              <code>last_name</code>, <code>email</code>, <code>phone</code>,{" "}
              <code>household</code>, <code>tags</code>
            </li>
            <li>
              Tags should be comma-separated within the column (e.g.
              &quot;Volunteer, Youth&quot;)
            </li>
            <li>Upload to Together Church — columns will auto-map</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
