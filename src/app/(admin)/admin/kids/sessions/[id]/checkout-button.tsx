"use client";

import { useState, useActionState } from "react";
import { checkOutKid } from "@/features/kids/server/actions";

export function CheckOutButton({ checkinId }: { checkinId: string }) {
  const [showInput, setShowInput] = useState(false);
  const [code, setCode] = useState("");

  const [error, formAction, pending] = useActionState(
    async (_prev: string | null) => {
      if (!code.trim()) return "Enter the pickup code.";
      try {
        await checkOutKid(checkinId, code);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Failed";
      }
    },
    null,
  );

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="rounded border border-zinc-300 px-3 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        Check Out
      </button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-1">
      <input
        type="text"
        placeholder="Code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        maxLength={4}
        className="w-20 rounded border border-zinc-300 px-2 py-1 text-center text-xs font-mono uppercase tracking-widest dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        autoFocus
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-2 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {pending ? "..." : "OK"}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </form>
  );
}
