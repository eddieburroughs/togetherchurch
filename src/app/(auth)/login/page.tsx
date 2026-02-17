import { ENV } from "@/lib/env";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  if (!ENV.isConfigured) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-amber-300 bg-amber-50 p-6 text-center dark:border-amber-700 dark:bg-amber-950">
          <h1 className="text-lg font-semibold text-amber-900 dark:text-amber-200">
            Setup Required
          </h1>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
            Supabase is not configured yet. Add your Supabase URL and anon key
            to <code className="font-mono">.env.local</code> to enable
            authentication.
          </p>
        </div>
      </main>
    );
  }

  // If already logged in, redirect to the right place
  const session = await getSessionUser();
  if (session) {
    const ctx = await getUserChurchContext(session.id);
    if (!ctx) {
      redirect("/admin/onboarding/new-church");
    } else if (ctx.role === "admin" || ctx.role === "leader") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Enter your email to sign in or create an account.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
