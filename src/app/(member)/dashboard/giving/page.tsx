import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { redirect } from "next/navigation";
import { listGivingPartners } from "@/features/giving/server/queries";
import Link from "next/link";

export default async function MemberGivingPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) redirect("/login");

  const partners = await listGivingPartners({ activeOnly: true });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/dashboard"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Giving</h1>

      {ctx.givingUrl && (
        <a
          href={ctx.givingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 block rounded-lg bg-zinc-900 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Give Online
        </a>
      )}

      {partners.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Our Partners</h2>
          <div className="mt-4 space-y-3">
            {partners.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">{p.name}</h3>
                    {p.category && (
                      <span className="mt-0.5 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {p.category}
                      </span>
                    )}
                  </div>
                  {p.website_url && (
                    <a
                      href={p.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs text-zinc-500 hover:underline"
                    >
                      Visit &rarr;
                    </a>
                  )}
                </div>
                {p.description && (
                  <p className="mt-2 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-400">
                    {p.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {!ctx.givingUrl && partners.length === 0 && (
        <p className="mt-6 text-sm text-zinc-500">
          Giving information is not yet available. Check back soon!
        </p>
      )}
    </main>
  );
}
