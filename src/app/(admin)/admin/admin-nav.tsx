"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFeature } from "@/lib/features/FeatureProvider";
import { signOut } from "@/lib/auth/signOut";

const NAV_ITEMS: {
  href: string;
  label: string;
  featureKey?: string;
}[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/people", label: "People", featureKey: "core.people" },
  { href: "/admin/events", label: "Events", featureKey: "core.events" },
  { href: "/admin/groups", label: "Groups", featureKey: "engage.groups" },
  { href: "/admin/announcements", label: "Announcements", featureKey: "core.announcements" },
  { href: "/admin/care-meals", label: "Care Meals", featureKey: "engage.care_meals" },
  { href: "/admin/kids", label: "Kids", featureKey: "services.kids_checkin" },
  { href: "/admin/messaging/compose", label: "Messaging", featureKey: "core.messaging_sms" },
  { href: "/admin/giving", label: "Giving", featureKey: "core.giving" },
  { href: "/admin/inbox", label: "Inbox", featureKey: "core.forms" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/audit-log", label: "Activity Log" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2 pl-4">
          <Link
            href="/dashboard"
            className="text-xs text-zinc-500 hover:underline"
          >
            Member View
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="text-xs text-zinc-500 hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  item,
  pathname,
}: {
  item: (typeof NAV_ITEMS)[number];
  pathname: string;
}) {
  const enabled = item.featureKey ? useFeature(item.featureKey) : true;
  if (!enabled) return null;

  const isActive =
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
        isActive
          ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
      }`}
    >
      {item.label}
    </Link>
  );
}
