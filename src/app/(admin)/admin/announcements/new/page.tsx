import { checkRouteFeature } from "@/lib/features";
import { listCampuses, getCampusMode } from "@/features/campuses/server/queries";
import { AnnouncementForm } from "./announcement-form";
import Link from "next/link";

export default async function NewAnnouncementPage() {
  await checkRouteFeature("core.announcements");

  const [campuses, campusMode] = await Promise.all([
    listCampuses(),
    getCampusMode(),
  ]);

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link
        href="/admin/announcements"
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to Announcements
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        New Announcement
      </h1>
      <AnnouncementForm
        campuses={campuses.map((c) => ({
          id: c.id,
          name: c.name,
          isDefault: c.is_default,
        }))}
        campusMode={campusMode}
      />
    </main>
  );
}
