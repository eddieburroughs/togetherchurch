"use client";

import { useActionState } from "react";
import { markAsRead, markAllAsRead } from "@/features/notifications/server/actions";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationList({
  notifications,
  totalCount,
  unreadCount,
}: {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
}) {
  const [, markAllAction, markAllPending] = useActionState(async () => {
    await markAllAsRead();
    return null;
  }, null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {totalCount} notification{totalCount !== 1 ? "s" : ""}
          {unreadCount > 0 && (
            <span className="ml-1 font-medium text-zinc-900 dark:text-zinc-100">
              ({unreadCount} unread)
            </span>
          )}
        </p>
        {unreadCount > 0 && (
          <form action={markAllAction}>
            <button
              type="submit"
              disabled={markAllPending}
              className="text-xs font-medium text-zinc-500 hover:underline disabled:opacity-50"
            >
              {markAllPending ? "..." : "Mark all read"}
            </button>
          </form>
        )}
      </div>

      <div className="mt-3 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {notifications.map((n) => (
          <NotificationRow key={n.id} notification={n} />
        ))}
        {notifications.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            No notifications yet.
          </p>
        )}
      </div>
    </div>
  );
}

function NotificationRow({ notification }: { notification: Notification }) {
  const [, formAction, pending] = useActionState(async () => {
    await markAsRead(notification.id);
    return null;
  }, null);

  const timeAgo = getTimeAgo(new Date(notification.createdAt));

  return (
    <div
      className={`px-4 py-3 ${
        notification.isRead
          ? "opacity-60"
          : "bg-zinc-50 dark:bg-zinc-900/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {!notification.isRead && (
              <span className="inline-block h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
            )}
            <p className="text-sm font-medium truncate">{notification.title}</p>
          </div>
          {notification.body && (
            <p className="mt-0.5 text-xs text-zinc-500 line-clamp-2">
              {notification.body}
            </p>
          )}
          <p className="mt-1 text-xs text-zinc-400">{timeAgo}</p>
        </div>
        {!notification.isRead && (
          <form action={formAction}>
            <button
              type="submit"
              disabled={pending}
              className="flex-shrink-0 text-xs text-zinc-500 hover:underline disabled:opacity-50"
            >
              {pending ? "..." : "Read"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}
