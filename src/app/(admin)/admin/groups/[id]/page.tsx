import { checkRouteFeature } from "@/lib/features";
import {
  getGroup,
  getGroupMembers,
  listChurchUsers,
} from "@/features/groups/server/queries";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MemberActions } from "./member-actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminGroupDetailPage({ params }: Props) {
  await checkRouteFeature("engage.groups");

  const session = await getSessionUser();
  if (!session) redirect("/login");
  const ctx = await getUserChurchContext(session.id);
  if (!ctx) redirect("/login");

  const { id } = await params;
  const group = await getGroup(id);
  if (!group) notFound();

  const members = await getGroupMembers(id);
  const churchUsers = await listChurchUsers(ctx.churchId);

  // Filter out users already in the group
  const memberUserIds = new Set(members.map((m) => m.user_id));
  const availableUsers = churchUsers.filter(
    (u) => !memberUserIds.has(u.user_id),
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/admin/groups"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Groups
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">{group.name}</h1>
      {group.description && (
        <p className="mt-1 text-sm text-zinc-500">{group.description}</p>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-semibold">
          Members ({members.length})
        </h2>

        <div className="mt-2 divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {members.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center justify-between px-4 py-2 text-sm"
            >
              <div>
                <span className="font-medium">{m.display_name}</span>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                    m.role === "leader"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {m.role}
                </span>
              </div>
              <MemberActions groupId={id} userId={m.user_id} type="remove" />
            </div>
          ))}
          {members.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              No members yet.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold">Add Member</h2>
        <MemberActions
          groupId={id}
          availableUsers={availableUsers}
          type="add"
        />
      </div>
    </main>
  );
}
