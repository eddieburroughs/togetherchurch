"use client";

import { useActionState } from "react";
import {
  createStripeConnectAccount,
  refreshStripeConnectStatus,
} from "@/features/tickets/server/actions";

export function StripeConnectClient({
  hasAccount,
}: {
  hasAccount: boolean;
}) {
  const [connectError, connectAction, connectPending] = useActionState(
    async (_prev: string | null) => {
      try {
        const result = await createStripeConnectAccount();
        window.location.href = result.url;
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Failed";
      }
    },
    null,
  );

  const [refreshError, refreshAction, refreshPending] = useActionState(
    async (_prev: string | null) => {
      try {
        await refreshStripeConnectStatus();
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Failed";
      }
    },
    null,
  );

  return (
    <div className="space-y-3">
      <form action={connectAction}>
        <button
          type="submit"
          disabled={connectPending}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {connectPending
            ? "Redirecting..."
            : hasAccount
              ? "Continue Stripe Setup"
              : "Connect Stripe Account"}
        </button>
      </form>
      {connectError && (
        <p className="text-sm text-red-600 dark:text-red-400">{connectError}</p>
      )}

      {hasAccount && (
        <>
          <form action={refreshAction}>
            <button
              type="submit"
              disabled={refreshPending}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {refreshPending ? "Refreshing..." : "Refresh Status"}
            </button>
          </form>
          {refreshError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {refreshError}
            </p>
          )}
        </>
      )}
    </div>
  );
}
