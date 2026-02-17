import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { ENV } from "@/lib/env";
import { NewChurchForm } from "./new-church-form";

export default async function NewChurchPage() {
  if (!ENV.isConfigured) redirect("/login");

  const session = await getSessionUser();
  if (!session) redirect("/login");

  // If they already have a church, skip onboarding
  const ctx = await getUserChurchContext(session.id);
  if (ctx) redirect("/admin");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold tracking-tight">
          Create Your Church
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Set up your church to get started with Together Church.
        </p>
        <NewChurchForm />
      </div>
    </main>
  );
}
