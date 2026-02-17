import { checkRouteFeature } from "@/lib/features";
import { listAllAnnouncements } from "@/features/announcements/server/queries";
import Link from "next/link";
import { AnnouncementAdminActions } from "./announcement-admin-actions";

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminAnnouncementsPage({ searchParams }: Props) {
  await checkRouteFeature("core.announcements");

  const params = await searchParams;
  const search = params.q ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 25;
  const offset = (page - 1) * limit;

  const { data: announcements, count } = await listAllAnnouncements(
    search,
    offset,
    limit,
  );
  const totalPages = Math.ceil(count / limit);

  function getStatus(a: { is_published: boolean; publish_at: string | null }) {
    if (!a.is_published) return "draft";
    if (a.publish_at && new Date(a.publish_at) > new Date()) return "scheduled";
    return "published";
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
        <Link
          href="/admin/announcements/new"
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          New Announcement
        </Link>
      </div>

      <form className="mt-4">
        <input
          name="q"
          type="text"
          placeholder="Search announcements..."
          defaultValue={search}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </form>

      <p className="mt-3 text-sm text-zinc-500">
        {count} {count === 1 ? "announcement" : "announcements"}
      </p>

      <div className="mt-4 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {announcements.map((a) => {
          const status = getStatus(a);
          return (
            <div key={a.id} className="px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/announcements/${a.id}`}
                    className="text-sm font-semibold hover:underline"
                  >
                    {a.title}
                  </Link>
                  {a.body && (
                    <p className="mt-1 truncate text-sm text-zinc-500">
                      {a.body.slice(0, 120)}
                      {a.body.length > 120 ? "..." : ""}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        status === "published"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : status === "scheduled"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {status}
                    </span>
                    {a.campus_name && (
                      <span className="text-xs text-zinc-400">{a.campus_name}</span>
                    )}
                    {a.publish_at && (
                      <span className="text-xs text-zinc-400">
                        {new Date(a.publish_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <AnnouncementAdminActions
                  announcementId={a.id}
                  isPublished={a.is_published}
                  status={status}
                />
              </div>
            </div>
          );
        })}
        {announcements.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            {search
              ? "No announcements match your search."
              : "No announcements yet. Create one to get started."}
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/announcements?q=${search}&page=${page - 1}`}
                className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/announcements?q=${search}&page=${page + 1}`}
                className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
