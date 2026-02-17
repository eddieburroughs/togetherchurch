import { listAuditEntries } from "@/features/audit/server/queries";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ page?: string; action?: string; type?: string }>;
}

const ACTION_LABELS: Record<string, string> = {
  "person.created": "Created person",
  "person.updated": "Updated person",
  "person.deleted": "Deleted person",
  "people.imported": "Imported people",
  "people.exported": "Exported people",
  "event.created": "Created event",
  "event.updated": "Updated event",
  "event.deleted": "Deleted event",
  "group.created": "Created group",
  "group.updated": "Updated group",
  "group.deleted": "Deleted group",
  "group.member_added": "Added group member",
  "group.member_removed": "Removed group member",
  "announcement.created": "Created announcement",
  "announcement.updated": "Updated announcement",
  "announcement.deleted": "Deleted announcement",
  "announcement.published": "Published announcement",
  "announcement.unpublished": "Unpublished announcement",
  "broadcast.sent": "Sent broadcast",
  "household.created": "Created household",
  "household.updated": "Updated household",
  "household.deleted": "Deleted household",
  "tag.created": "Created tag",
  "tag.deleted": "Deleted tag",
  "train.created": "Created meal train",
  "train.updated": "Updated meal train",
  "train.deleted": "Deleted meal train",
  "template.created": "Created template",
  "template.updated": "Updated template",
  "template.deleted": "Deleted template",
  "order.refunded": "Refunded order",
};

const TARGET_TYPES = [
  "person",
  "event",
  "group",
  "announcement",
  "broadcast",
  "household",
  "tag",
  "train",
  "template",
  "order",
];

function formatAction(action: string): string {
  return ACTION_LABELS[action] ?? action;
}

function formatMeta(meta: Record<string, unknown> | null): string {
  if (!meta) return "";
  if (meta.name) return String(meta.name);
  if (meta.title) return String(meta.title);
  if (meta.imported !== undefined)
    return `${meta.imported} imported, ${meta.skipped ?? 0} skipped`;
  if (meta.sent !== undefined)
    return `${meta.sent} sent${meta.failed ? `, ${meta.failed} failed` : ""}`;
  if (meta.confirmation_code)
    return `${meta.confirmation_code}${meta.amount_cents ? ` ($${(Number(meta.amount_cents) / 100).toFixed(2)})` : ""}`;
  return "";
}

export default async function AuditLogPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 50;
  const offset = (page - 1) * limit;
  const actionFilter = params.action || undefined;
  const typeFilter = params.type || undefined;

  const { data: entries, count } = await listAuditEntries({
    action: actionFilter,
    targetType: typeFilter,
    offset,
    limit,
  });

  const totalPages = Math.ceil(count / limit);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { page: params.page, action: params.action, type: params.type, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "1") p.set(k, v);
      else if (k === "page" && v === "1") { /* skip default page */ }
    }
    const qs = p.toString();
    return `/admin/audit-log${qs ? `?${qs}` : ""}`;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin" className="text-sm text-zinc-500 hover:underline">
        &larr; Admin
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Activity Log</h1>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        {typeFilter && (
          <Link
            href={buildUrl({ type: undefined, page: "1" })}
            className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Type: {typeFilter} &times;
          </Link>
        )}
        {actionFilter && (
          <Link
            href={buildUrl({ action: undefined, page: "1" })}
            className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Action: {actionFilter} &times;
          </Link>
        )}
        {!typeFilter && (
          <div className="flex flex-wrap gap-1">
            {TARGET_TYPES.map((t) => (
              <Link
                key={t}
                href={buildUrl({ type: t, page: "1" })}
                className="rounded border border-zinc-200 px-2 py-0.5 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {t}
              </Link>
            ))}
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        {count} entr{count === 1 ? "y" : "ies"}
      </p>

      {/* Entries */}
      <div className="mt-2 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {entries.map((e) => (
          <div key={e.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-medium">{e.actor_name}</span>{" "}
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {formatAction(e.action)}
                  </span>
                </p>
                {formatMeta(e.meta) && (
                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                    {formatMeta(e.meta)}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-zinc-400">
                {new Date(e.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">
            No activity recorded yet.
          </p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildUrl({ page: String(page - 1) })}
                className="rounded border border-zinc-300 px-3 py-1 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildUrl({ page: String(page + 1) })}
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
