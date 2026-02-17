import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getChurchFeatures } from "@/lib/features/getChurchFeatures";
import { hasFeature } from "@/lib/features/hasFeature";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) redirect("/login");

  const features = await getChurchFeatures(ctx.churchId);
  const hasCampuses = hasFeature(features, "org.campuses");
  const hasTickets = hasFeature(features, "engage.events.tickets");

  const links = [
    { href: "/admin/settings/church", label: "Church Settings", description: "Campus mode and general configuration" },
    { href: "/admin/settings/plan", label: "Plan & Billing", description: "Your subscription and plan details" },
    { href: "/admin/settings/features", label: "Features", description: "View enabled features for your plan" },
  ];

  if (hasCampuses) {
    links.push({ href: "/admin/settings/campuses", label: "Campuses", description: "Manage physical locations" });
  }

  if (hasTickets) {
    links.push({ href: "/admin/settings/stripe-connect", label: "Stripe Connect", description: "Payment processing for tickets" });
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <div className="mt-6 space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50"
          >
            <p className="text-sm font-medium">{link.label}</p>
            <p className="text-xs text-zinc-500">{link.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
