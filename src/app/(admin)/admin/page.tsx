import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

async function getDashboardStats(churchId: string) {
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const now = new Date().toISOString();

  const [peopleResult, eventsResult, groupsResult, recentActivity] =
    await Promise.all([
      supabase
        .from("people")
        .select("id", { count: "exact", head: true })
        .eq("church_id", churchId),
      supabase
        .from("events")
        .select("id, title, starts_at")
        .eq("church_id", churchId)
        .gte("starts_at", now)
        .order("starts_at")
        .limit(5),
      supabase
        .from("groups")
        .select("id", { count: "exact", head: true })
        .eq("church_id", churchId),
      supabase
        .from("audit_log")
        .select("id, action, actor_user_id, meta, created_at")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  // Resolve actor names for recent activity
  const entries = recentActivity.data ?? [];
  let actorNames = new Map<string, string>();
  if (entries.length > 0) {
    const userIds = [...new Set(entries.map((e) => e.actor_user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, email")
      .in("user_id", userIds);
    actorNames = new Map(
      (profiles ?? []).map((p) => [
        p.user_id,
        p.display_name ?? p.email ?? "Unknown",
      ]),
    );
  }

  return {
    peopleCount: peopleResult.count ?? 0,
    upcomingEvents: eventsResult.data ?? [],
    groupsCount: groupsResult.count ?? 0,
    recentActivity: entries.map((e) => ({
      ...e,
      actor_name: actorNames.get(e.actor_user_id) ?? "Unknown",
    })),
  };
}

const ACTION_LABELS: Record<string, string> = {
  "person.created": "added a person",
  "person.updated": "updated a person",
  "person.deleted": "deleted a person",
  "people.imported": "imported people",
  "event.created": "created an event",
  "event.updated": "updated an event",
  "event.deleted": "deleted an event",
  "group.created": "created a group",
  "group.updated": "updated a group",
  "group.deleted": "deleted a group",
  "announcement.created": "created an announcement",
  "announcement.published": "published an announcement",
  "broadcast.sent": "sent a broadcast",
  "train.created": "created a meal train",
  "template.created": "created a template",
  "order.refunded": "refunded an order",
  "partner.created": "added a giving partner",
  "giving.url_updated": "updated giving URL",
  "campus.created": "created a campus",
  "campus.updated": "updated a campus",
  "campus.deleted": "deleted a campus",
  "ticket_type.created": "created a ticket type",
  "kid.created": "added a child",
  "session.created": "created a check-in session",
};

function formatAction(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

export default async function AdminDashboard() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) redirect("/login");

  const stats = await getDashboardStats(ctx.churchId);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/people"
          className="rounded-lg border border-zinc-200 p-5 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          <p className="text-sm text-zinc-500">People</p>
          <p className="mt-1 text-3xl font-bold">
            {stats?.peopleCount ?? 0}
          </p>
        </Link>
        <Link
          href="/admin/groups"
          className="rounded-lg border border-zinc-200 p-5 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          <p className="text-sm text-zinc-500">Groups</p>
          <p className="mt-1 text-3xl font-bold">
            {stats?.groupsCount ?? 0}
          </p>
        </Link>
        <Link
          href="/admin/events"
          className="rounded-lg border border-zinc-200 p-5 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          <p className="text-sm text-zinc-500">Upcoming Events</p>
          <p className="mt-1 text-3xl font-bold">
            {stats?.upcomingEvents.length ?? 0}
          </p>
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Upcoming events */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming Events</h2>
            <Link
              href="/admin/events"
              className="text-xs text-zinc-500 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {stats?.upcomingEvents.map((event) => (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <span className="text-sm font-medium">{event.title}</span>
                <span className="shrink-0 text-xs text-zinc-400">
                  {new Date(event.starts_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </Link>
            ))}
            {(!stats || stats.upcomingEvents.length === 0) && (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">
                No upcoming events
              </p>
            )}
          </div>
        </section>

        {/* Recent activity */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Link
              href="/admin/audit-log"
              className="text-xs text-zinc-500 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {stats?.recentActivity.map((entry) => (
              <div key={entry.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-sm">
                    <span className="font-medium">{entry.actor_name}</span>{" "}
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {formatAction(entry.action)}
                    </span>
                  </p>
                  <span className="shrink-0 text-xs text-zinc-400">
                    {new Date(entry.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            {(!stats || stats.recentActivity.length === 0) && (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">
                No activity recorded yet
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
