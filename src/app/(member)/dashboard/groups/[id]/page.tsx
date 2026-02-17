import { checkRouteFeature } from "@/lib/features";
import {
  getGroup,
  getGroupMembership,
  getChatMessages,
} from "@/features/groups/server/queries";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChatUI } from "./chat-ui";
import { GroupSettings } from "./group-settings";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MemberGroupDetailPage({ params }: Props) {
  await checkRouteFeature("engage.groups");

  const session = await getSessionUser();
  if (!session) redirect("/login");

  const { id } = await params;
  const group = await getGroup(id);
  if (!group) notFound();

  const membership = await getGroupMembership(id, session.id);
  if (!membership) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link
          href="/dashboard/groups"
          className="text-sm text-zinc-500 hover:underline"
        >
          &larr; Back to Groups
        </Link>
        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-6 text-center dark:border-amber-700 dark:bg-amber-950">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            You are not a member of this group.
          </p>
        </div>
      </main>
    );
  }

  const messages = await getChatMessages(id, { limit: 50 });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/dashboard/groups"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Groups
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{group.name}</h1>
          {group.description && (
            <p className="mt-1 text-sm text-zinc-500">{group.description}</p>
          )}
        </div>
      </div>

      <GroupSettings
        groupId={id}
        smsMirrorOptIn={membership.sms_mirror_opt_in}
        smsNotifyOptIn={membership.sms_notify_opt_in}
        isMuted={membership.is_muted}
      />

      <div className="mt-6">
        <ChatUI
          groupId={id}
          currentUserId={session.id}
          initialMessages={messages.map((m) => ({
            id: m.id,
            senderName: m.sender_name ?? "Unknown",
            senderUserId: m.sender_user_id,
            source: m.source,
            body: m.body,
            createdAt: m.created_at,
          }))}
        />
      </div>
    </main>
  );
}
