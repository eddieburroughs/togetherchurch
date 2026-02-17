import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import {
  getChurchFeatures,
  featureMapToObject,
} from "@/lib/features/getChurchFeatures";
import { FeatureProvider } from "@/lib/features/FeatureProvider";
import { ENV } from "@/lib/env";
import { AdminNav } from "./admin/admin-nav";

export default async function AdminLayout({
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

  // No membership at all — send to onboarding
  if (!ctx) {
    redirect("/admin/onboarding/new-church");
  }

  // Only admin or leader can access admin routes
  if (ctx.role !== "admin" && ctx.role !== "leader") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-red-300 bg-red-50 p-6 text-center dark:border-red-700 dark:bg-red-950">
          <h1 className="text-lg font-semibold text-red-900 dark:text-red-200">
            Access Denied
          </h1>
          <p className="mt-2 text-sm text-red-700 dark:text-red-400">
            You do not have permission to access this area.
          </p>
          <a
            href="/dashboard"
            className="mt-4 inline-block text-sm font-medium text-red-800 underline dark:text-red-300"
          >
            Go to Dashboard
          </a>
        </div>
      </main>
    );
  }

  // Resolve features for client-side gating (Layer 1)
  const featureMap = await getChurchFeatures(ctx.churchId);
  const features = featureMapToObject(featureMap);

  return (
    <FeatureProvider features={features}>
      <AdminNav />
      {children}
    </FeatureProvider>
  );
}
