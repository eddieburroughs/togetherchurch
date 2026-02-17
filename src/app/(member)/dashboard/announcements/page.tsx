import { getSessionUser } from "@/lib/auth/getSessionUser";
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

export default async function AnnouncementsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const announcements = await listPublishedAnnouncements();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/dashboard"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Announcements
      </h1>

      {announcements.length > 0 ? (
        <div className="mt-6 space-y-4">
          {announcements.map((a) => (
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
        </div>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">
          No announcements right now. Check back soon!
        </p>
      )}
    </main>
  );
}
