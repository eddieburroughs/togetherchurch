import {
  listNotifications,
  getUnreadCount,
} from "@/features/notifications/server/queries";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NotificationList } from "@/features/notifications/components/notification-list";

export default async function MemberNotificationsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const [{ data: notifications, count }, unreadCount] = await Promise.all([
    listNotifications({ limit: 100 }),
    getUnreadCount(),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/dashboard"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Notifications
      </h1>

      <div className="mt-6">
        <NotificationList
          notifications={notifications.map((n) => ({
            id: n.id,
            type: n.type,
            title: n.title,
            body: n.body,
            isRead: n.is_read,
            createdAt: n.created_at,
          }))}
          totalCount={count}
          unreadCount={unreadCount}
        />
      </div>
    </main>
  );
}
