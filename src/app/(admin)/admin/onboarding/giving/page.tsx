import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { ENV } from "@/lib/env";
import { GivingForm } from "./giving-form";

export default async function GivingPage() {
  if (!ENV.isConfigured) redirect("/login");

  const session = await getSessionUser();
  if (!session) redirect("/login");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold tracking-tight">Online Giving</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Add your external giving link so members can give directly.
        </p>
        <GivingForm />

        <div className="mt-8 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Need a giving provider?
          </h2>
          <ul className="mt-2 space-y-1 text-sm text-zinc-500 dark:text-zinc-400">
            <li>
              <span className="font-medium">Tithe.ly</span> — tithe.ly
            </li>
            <li>
              <span className="font-medium">Pushpay</span> — pushpay.com
            </li>
            <li>
              <span className="font-medium">Subsplash Giving</span> —
              subsplash.com
            </li>
            <li>
              <span className="font-medium">Planning Center Giving</span> —
              planningcenter.com
            </li>
          </ul>
        </div>

        <a
          href="/admin/onboarding/import"
          className="mt-4 block text-center text-sm text-zinc-500 underline dark:text-zinc-400"
        >
          Skip for now
        </a>
      </div>
    </main>
  );
}
