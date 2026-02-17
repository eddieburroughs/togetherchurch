import { checkRouteFeature } from "@/lib/features";
import { listGivingPartners } from "@/features/giving/server/queries";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GivingUrlForm } from "./giving-url-form";
import { PartnerDeleteButton } from "./partner-delete-button";

export default async function AdminGivingPage() {
  await checkRouteFeature("core.giving");

  const session = await getSessionUser();
  if (!session) redirect("/login");
  const ctx = await getUserChurchContext(session.id);
  if (!ctx) redirect("/login");

  const partners = await listGivingPartners();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
        &larr; Admin
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Giving</h1>

      {/* Giving URL */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">Online Giving Link</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Members will see a &quot;Give&quot; button linking to this URL.
        </p>
        <GivingUrlForm currentUrl={ctx.givingUrl ?? ""} />
      </section>

      {/* Partners */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Giving Partners</h2>
          <Link
            href="/admin/giving/new"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Add Partner
          </Link>
        </div>

        <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {partners.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 px-4 py-3"
            >
              <Link
                href={`/admin/giving/${p.id}`}
                className="min-w-0 flex-1 hover:underline"
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{p.name}</p>
                  {!p.is_active && (
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                      inactive
                    </span>
                  )}
                </div>
                {(p.category || p.description) && (
                  <p className="text-xs text-zinc-500">
                    {p.category && <span>{p.category}</span>}
                    {p.category && p.description && <span> &middot; </span>}
                    {p.description && (
                      <span>
                        {p.description.length > 60
                          ? p.description.slice(0, 60) + "..."
                          : p.description}
                      </span>
                    )}
                  </p>
                )}
              </Link>
              <PartnerDeleteButton id={p.id} />
            </div>
          ))}
          {partners.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              No giving partners added yet.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
