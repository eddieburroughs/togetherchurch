import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { redirect } from "next/navigation";
import { listPublishedAnnouncements } from "@/features/announcements/server/queries";
import Link from "next/link";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default async function MemberDashboard() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const ctx = await getUserChurchContext(session.id);
  const announcements = await listPublishedAnnouncements();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Home</h1>

      {ctx?.givingUrl && (
        <div className="mt-4 flex gap-2">
          <a
            href={ctx.givingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Give Online
          </a>
          <Link
            href="/dashboard/giving"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Giving &amp; Partners
          </Link>
        </div>
      )}

      {announcements.length > 0 ? (
        <div className="mt-6 space-y-4">
          {announcements.slice(0, 10).map((a) => (
            <article
              key={a.id}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold">{a.title}</h2>
                <span className="shrink-0 text-xs text-zinc-400">
                  {timeAgo(a.publish_at ?? a.created_at)}
                </span>
              </div>
              {a.body && (
                <p className="mt-2 whitespace-pre-line text-sm text-zinc-600 dark:text-zinc-400">
                  {a.body}
                </p>
              )}
              {a.campus_name && (
                <span className="mt-2 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {a.campus_name}
                </span>
              )}
            </article>
          ))}

          {announcements.length > 10 && (
            <Link
              href="/dashboard/announcements"
              className="block text-center text-sm text-zinc-500 hover:underline"
            >
              View all announcements
            </Link>
          )}
        </div>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">
          No announcements right now. Check back soon!
        </p>
      )}
    </main>
  );
}
