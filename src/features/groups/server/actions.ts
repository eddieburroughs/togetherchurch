"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getUserChurchContext } from "@/lib/auth/getUserChurchContext";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { requireFeature } from "@/lib/features/requireFeature";
import { sendPushNotifications } from "@/lib/push/pushService";
import { sendSms, isTwilioConfigured } from "@/features/messaging/lib/sms-provider";

function generateToken(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 for readability
  let token = "G-";
  for (let i = 0; i < 6; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

// ── Group CRUD ──────────────────────────────────────────────────────────

export async function createGroup(formData: FormData) {
  const { ctx } = await requireFeature("engage.groups");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Group name is required.");

  const { error } = await admin.from("groups").insert({
    church_id: ctx.churchId,
    name,
    description: (formData.get("description") as string)?.trim() || null,
  });

  if (error) throw new Error(error.message);
  redirect("/admin/groups");
}

export async function updateGroup(id: string, formData: FormData) {
  const { ctx } = await requireFeature("engage.groups");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Group name is required.");

  const { error } = await admin
    .from("groups")
    .update({
      name,
      description: (formData.get("description") as string)?.trim() || null,
    })
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/groups/${id}`);
}

export async function deleteGroup(id: string) {
  const { ctx } = await requireFeature("engage.groups");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("groups")
    .delete()
    .eq("id", id)
    .eq("church_id", ctx.churchId);

  redirect("/admin/groups");
}

// ── Members ─────────────────────────────────────────────────────────────

export async function addGroupMember(groupId: string, userId: string, role: "leader" | "member") {
  const { ctx } = await requireFeature("engage.groups");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const { error } = await admin.from("group_members").insert({
    group_id: groupId,
    church_id: ctx.churchId,
    user_id: userId,
    role,
  });

  if (error) {
    if (error.code === "23505") throw new Error("User is already a member.");
    throw new Error(error.message);
  }

  revalidatePath(`/admin/groups/${groupId}`);
}

export async function removeGroupMember(groupId: string, userId: string) {
  const { ctx } = await requireFeature("engage.groups");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  await admin
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("church_id", ctx.churchId)
    .eq("user_id", userId);

  revalidatePath(`/admin/groups/${groupId}`);
}

// ── Member self-service toggles ─────────────────────────────────────────

export async function updateMemberPreferences(
  groupId: string,
  prefs: {
    sms_mirror_opt_in?: boolean;
    sms_notify_opt_in?: boolean;
    is_muted?: boolean;
  },
) {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  const update: Record<string, boolean> = {};
  if (prefs.sms_mirror_opt_in !== undefined) update.sms_mirror_opt_in = prefs.sms_mirror_opt_in;
  if (prefs.sms_notify_opt_in !== undefined) update.sms_notify_opt_in = prefs.sms_notify_opt_in;
  if (prefs.is_muted !== undefined) update.is_muted = prefs.is_muted;

  await admin
    .from("group_members")
    .update(update)
    .eq("group_id", groupId)
    .eq("user_id", session.id);

  revalidatePath(`/dashboard/groups/${groupId}`);
}

// ── Chat ────────────────────────────────────────────────────────────────

export async function postChatMessage(groupId: string, body: string) {
  const session = await getSessionUser();
  if (!session) throw new Error("Authentication required.");

  const ctx = await getUserChurchContext(session.id);
  if (!ctx) throw new Error("No church membership.");

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Server not configured.");

  // Verify membership
  const { data: membership } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", session.id)
    .single();

  if (!membership) throw new Error("You are not a member of this group.");

  const messageBody = body.trim();
  if (!messageBody) throw new Error("Message cannot be empty.");

  // Insert message
  await admin.from("chat_messages").insert({
    church_id: ctx.churchId,
    group_id: groupId,
    sender_user_id: session.id,
    source: "app",
    body: messageBody,
  });

  // Get group info and other members
  const { data: group } = await admin
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .single();

  const { data: members } = await admin
    .from("group_members")
    .select("user_id, sms_notify_opt_in, is_muted")
    .eq("group_id", groupId)
    .neq("user_id", session.id);

  if (members && members.length > 0) {
    // Get sender display name
    const { data: senderProfile } = await admin
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", session.id)
      .single();

    const senderName = senderProfile?.display_name ?? senderProfile?.email ?? "Someone";
    const groupName = group?.name ?? "Group";

    // Push/in-app notifications for non-muted members
    const notifyUserIds = members
      .filter((m) => !m.is_muted)
      .map((m) => m.user_id);

    if (notifyUserIds.length > 0) {
      await sendPushNotifications({
        churchId: ctx.churchId,
        userIds: notifyUserIds,
        title: groupName,
        body: `${senderName}: ${messageBody.slice(0, 100)}`,
        type: "group_chat",
        data: { group_id: groupId },
      });
    }

    // SMS notifications for opted-in members
    if (isTwilioConfigured()) {
      const smsMembers = members.filter((m) => m.sms_notify_opt_in);
      if (smsMembers.length > 0) {
        const smsUserIds = smsMembers.map((m) => m.user_id);
        const { data: profiles } = await admin
          .from("profiles")
          .select("user_id, phone, sms_opt_out")
          .in("user_id", smsUserIds)
          .eq("sms_opt_out", false)
          .not("phone", "is", null);

        for (const profile of profiles ?? []) {
          if (!profile.phone) continue;

          // Create a reply token so they can respond via SMS
          const token = generateToken();
          const expires = new Date();
          expires.setHours(expires.getHours() + 24);

          await admin.from("sms_thread_tokens").insert({
            token,
            church_id: ctx.churchId,
            group_id: groupId,
            user_id: profile.user_id,
            expires_at: expires.toISOString(),
          });

          const smsBody = `[${groupName}] ${senderName}: ${messageBody.slice(0, 120)}\nReply ${token} <your message> to respond.`;

          try {
            await sendSms(profile.phone, smsBody);
          } catch {
            // SMS delivery failure is non-critical
          }
        }
      }
    }
  }

  revalidatePath(`/dashboard/groups/${groupId}`);
}

/**
 * Handle an inbound SMS that contains a group reply token.
 * Called from the Twilio webhook.
 */
export async function handleGroupSmsReply(
  phone: string,
  token: string,
  messageBody: string,
) {
  const admin = getSupabaseAdmin();
  if (!admin) return { handled: false };

  // Look up token
  const { data: tokenRow } = await admin
    .from("sms_thread_tokens")
    .select("*")
    .eq("token", token)
    .single();

  if (!tokenRow) return { handled: false };

  // Check expiry
  if (new Date(tokenRow.expires_at) < new Date()) {
    // Clean up expired token
    await admin.from("sms_thread_tokens").delete().eq("token", token);
    return { handled: false };
  }

  // Resolve user by phone number from profiles
  const { data: profile } = await admin
    .from("profiles")
    .select("user_id, display_name, email")
    .eq("phone", phone)
    .single();

  // Fall back to the user_id from the token if phone lookup fails
  const senderUserId = profile?.user_id ?? tokenRow.user_id;
  const senderName = profile?.display_name ?? profile?.email ?? "SMS User";

  // Verify group membership
  const { data: membership } = await admin
    .from("group_members")
    .select("role")
    .eq("group_id", tokenRow.group_id)
    .eq("user_id", senderUserId)
    .single();

  if (!membership) return { handled: false };

  // Insert chat message with source=sms
  await admin.from("chat_messages").insert({
    church_id: tokenRow.church_id,
    group_id: tokenRow.group_id,
    sender_user_id: senderUserId,
    source: "sms",
    body: messageBody,
    meta: { from_phone: phone, token },
  });

  // Get group name
  const { data: group } = await admin
    .from("groups")
    .select("name")
    .eq("id", tokenRow.group_id)
    .single();

  const groupName = group?.name ?? "Group";

  // Notify other group members (push/in-app)
  const { data: members } = await admin
    .from("group_members")
    .select("user_id, sms_notify_opt_in, is_muted")
    .eq("group_id", tokenRow.group_id)
    .neq("user_id", senderUserId);

  if (members && members.length > 0) {
    const notifyUserIds = members
      .filter((m) => !m.is_muted)
      .map((m) => m.user_id);

    if (notifyUserIds.length > 0) {
      await sendPushNotifications({
        churchId: tokenRow.church_id,
        userIds: notifyUserIds,
        title: groupName,
        body: `${senderName} (SMS): ${messageBody.slice(0, 100)}`,
        type: "group_chat",
        data: { group_id: tokenRow.group_id },
      });
    }

    // Forward SMS to other members who opted in
    if (isTwilioConfigured()) {
      const smsRecipients = members.filter((m) => m.sms_notify_opt_in);
      if (smsRecipients.length > 0) {
        const smsUserIds = smsRecipients.map((m) => m.user_id);
        const { data: recipientProfiles } = await admin
          .from("profiles")
          .select("user_id, phone, sms_opt_out")
          .in("user_id", smsUserIds)
          .eq("sms_opt_out", false)
          .not("phone", "is", null);

        for (const rp of recipientProfiles ?? []) {
          if (!rp.phone || rp.phone === phone) continue; // don't echo back to sender

          const newToken = generateToken();
          const expires = new Date();
          expires.setHours(expires.getHours() + 24);

          await admin.from("sms_thread_tokens").insert({
            token: newToken,
            church_id: tokenRow.church_id,
            group_id: tokenRow.group_id,
            user_id: rp.user_id,
            expires_at: expires.toISOString(),
          });

          try {
            await sendSms(
              rp.phone,
              `[${groupName}] ${senderName}: ${messageBody.slice(0, 120)}\nReply ${newToken} <msg> to respond.`,
            );
          } catch {
            // Non-critical
          }
        }
      }
    }
  }

  // Clean up used token
  await admin.from("sms_thread_tokens").delete().eq("token", token);

  return { handled: true };
}
