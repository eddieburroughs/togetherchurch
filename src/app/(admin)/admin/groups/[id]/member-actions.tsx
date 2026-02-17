"use client";

import { useActionState } from "react";
import { addGroupMember, removeGroupMember } from "@/features/groups/server/actions";
import { useState } from "react";

interface AddProps {
  groupId: string;
  type: "add";
  availableUsers: { user_id: string; display_name: string; role: string }[];
  userId?: never;
}

interface RemoveProps {
  groupId: string;
  type: "remove";
  userId: string;
  availableUsers?: never;
}

type Props = AddProps | RemoveProps;

export function MemberActions(props: Props) {
  if (props.type === "remove") {
    return <RemoveButton groupId={props.groupId} userId={props.userId} />;
  }

  return (
    <AddMemberForm
      groupId={props.groupId}
      availableUsers={props.availableUsers}
    />
  );
}

function RemoveButton({
  groupId,
  userId,
}: {
  groupId: string;
  userId: string;
}) {
  const [error, formAction, pending] = useActionState(
    async (_prev: string | null) => {
      try {
        await removeGroupMember(groupId, userId);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Failed";
      }
    },
    null,
  );

  return (
    <form action={formAction}>
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
      >
        {pending ? "..." : "Remove"}
      </button>
      {error && <span className="ml-1 text-xs text-red-500">{error}</span>}
    </form>
  );
}

function AddMemberForm({
  groupId,
  availableUsers,
}: {
  groupId: string;
  availableUsers: { user_id: string; display_name: string; role: string }[];
}) {
  const [selectedUser, setSelectedUser] = useState("");
  const [role, setRole] = useState<"member" | "leader">("member");

  const [error, formAction, pending] = useActionState(
    async (_prev: string | null) => {
      if (!selectedUser) return "Please select a user.";
      try {
        await addGroupMember(groupId, selectedUser, role);
        setSelectedUser("");
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Failed";
      }
    },
    null,
  );

  if (availableUsers.length === 0) {
    return (
      <p className="mt-2 text-sm text-zinc-500">
        All church members are already in this group.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-2 flex items-end gap-2">
      <div className="flex-1">
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="">Select a member...</option>
          {availableUsers.map((u) => (
            <option key={u.user_id} value={u.user_id}>
              {u.display_name} ({u.role})
            </option>
          ))}
        </select>
      </div>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as "member" | "leader")}
        className="rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <option value="member">Member</option>
        <option value="leader">Leader</option>
      </select>
      <button
        type="submit"
        disabled={pending || !selectedUser}
        className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "..." : "Add"}
      </button>
      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </form>
  );
}
