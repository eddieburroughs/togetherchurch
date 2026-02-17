import { checkRouteFeature } from "@/lib/features";
import { getStripeConnect } from "@/features/tickets/server/queries";
import Link from "next/link";
import { StripeConnectClient } from "./stripe-connect-client";

export default async function StripeConnectPage() {
  await checkRouteFeature("engage.events.tickets");

  const connect = await getStripeConnect();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/admin/settings"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Settings
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Stripe Connect
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Connect your Stripe account to accept paid ticket payments.
      </p>

      <div className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        {connect ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Account ID</span>
              <span className="font-mono text-xs text-zinc-500">
                {connect.stripe_account_id}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Charges Enabled</span>
              <span
                className={`text-sm font-medium ${connect.charges_enabled ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                {connect.charges_enabled ? "Yes" : "No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Details Submitted</span>
              <span
                className={`text-sm font-medium ${connect.details_submitted ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}
              >
                {connect.details_submitted ? "Yes" : "Pending"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">
            No Stripe account connected yet.
          </p>
        )}
      </div>

      <div className="mt-4">
        <StripeConnectClient hasAccount={!!connect} />
      </div>
    </main>
  );
}
