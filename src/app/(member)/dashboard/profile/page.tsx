import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const supabase = await getSupabaseServer();
  const { data: profile } = await supabase!
    .from("profiles")
    .select("display_name, phone, email")
    .eq("user_id", session.id)
    .single();

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      <p className="mt-1 text-sm text-zinc-500">{session.email}</p>

      <div className="mt-6">
        <ProfileForm
          displayName={profile?.display_name ?? ""}
          phone={profile?.phone ?? ""}
        />
      </div>
    </main>
  );
}
