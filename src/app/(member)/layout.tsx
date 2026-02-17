import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import {
  getChurchFeatures,
  featureMapToObject,
} from "@/lib/features/getChurchFeatures";
import { FeatureProvider } from "@/lib/features/FeatureProvider";
import { ENV } from "@/lib/env";
import { MemberNav } from "./member-nav";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!ENV.isConfigured) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <p className="text-sm text-zinc-500">Supabase is not configured.</p>
      </main>
    );
  }

  const session = await getSessionUser();
  if (!session) {
    redirect("/login");
  }

  const ctx = await getUserChurchContext(session.id);

  if (!ctx) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-amber-300 bg-amber-50 p-6 text-center dark:border-amber-700 dark:bg-amber-950">
          <h1 className="text-lg font-semibold text-amber-900 dark:text-amber-200">
            Access Not Granted
          </h1>
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
            You are not a member of any church yet. Ask your church admin to
            invite you, or create a new church.
          </p>
          <a
            href="/admin/onboarding/new-church"
            className="mt-4 inline-block text-sm font-medium text-amber-800 underline dark:text-amber-300"
          >
            Create a Church
          </a>
        </div>
      </main>
    );
  }

  const isAdmin = ctx.role === "admin" || ctx.role === "leader";
  const featureMap = await getChurchFeatures(ctx.churchId);
  const features = featureMapToObject(featureMap);

  return (
    <FeatureProvider features={features}>
      <MemberNav isAdmin={isAdmin} />
      {children}
    </FeatureProvider>
  );
}
