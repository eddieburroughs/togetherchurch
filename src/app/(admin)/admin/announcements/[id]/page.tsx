import { checkRouteFeature } from "@/lib/features";
import { getAnnouncement } from "@/features/announcements/server/queries";
import { listCampuses, getCampusMode } from "@/features/campuses/server/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EditAnnouncementForm } from "./edit-announcement-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditAnnouncementPage({ params }: Props) {
  await checkRouteFeature("core.announcements");

  const { id } = await params;
  const announcement = await getAnnouncement(id);
  if (!announcement) notFound();

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
        Edit Announcement
      </h1>
      <EditAnnouncementForm
        announcement={{
          id: announcement.id,
          title: announcement.title,
          body: announcement.body ?? "",
          campusId: announcement.campus_id ?? "",
          publishAt: announcement.publish_at ?? "",
          isPublished: announcement.is_published,
        }}
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
