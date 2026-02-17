import { checkRouteFeature } from "@/lib/features";
import { getPerson, getPersonTags, listHouseholds, listTags } from "@/features/people/server/queries";
import { listCampuses, getCampusMode } from "@/features/campuses/server/queries";
import { notFound } from "next/navigation";
import Link from "next/link";
import { EditPersonForm } from "./edit-person-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPersonPage({ params }: Props) {
  await checkRouteFeature("core.people");

  const { id } = await params;
  const person = await getPerson(id);
  if (!person) notFound();

  const [personTags, campuses, campusMode, households, tags] = await Promise.all([
    getPersonTags(id),
    listCampuses(),
    getCampusMode(),
    listHouseholds(),
    listTags(),
  ]);

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <Link
        href={`/admin/people/${id}`}
        className="text-sm text-zinc-500 hover:underline"
      >
        &larr; Back to {person.first_name} {person.last_name}
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">Edit Person</h1>

      <EditPersonForm
        person={{
          id: person.id,
          firstName: person.first_name,
          lastName: person.last_name,
          email: person.email ?? "",
          phone: person.phone ?? "",
          status: person.status,
          householdId: person.household_id ?? "",
          campusId: person.campus_id ?? "",
        }}
        currentTagIds={personTags.map((t) => t.id)}
        campuses={campuses.map((c) => ({ id: c.id, name: c.name, isDefault: c.is_default }))}
        campusMode={campusMode}
        households={households.map((h) => ({ id: h.id, name: h.name }))}
        tags={tags.map((t) => ({ id: t.id, name: t.name }))}
      />
    </main>
  );
}
