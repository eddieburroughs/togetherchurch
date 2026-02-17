"use client";

import { useState } from "react";
import { updateMemberPreferences } from "@/features/groups/server/actions";

export function GroupSettings({
  groupId,
  smsMirrorOptIn,
  smsNotifyOptIn,
  isMuted,
}: {
  groupId: string;
  smsMirrorOptIn: boolean;
  smsNotifyOptIn: boolean;
  isMuted: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mirror, setMirror] = useState(smsMirrorOptIn);
  const [notify, setNotify] = useState(smsNotifyOptIn);
  const [muted, setMuted] = useState(isMuted);
  const [saving, setSaving] = useState(false);

  async function toggle(
    key: "sms_mirror_opt_in" | "sms_notify_opt_in" | "is_muted",
    value: boolean,
  ) {
    setSaving(true);
    try {
      await updateMemberPreferences(groupId, { [key]: value });
      if (key === "sms_mirror_opt_in") setMirror(value);
      if (key === "sms_notify_opt_in") setNotify(value);
      if (key === "is_muted") setMuted(value);
    } catch {
      // revert on error
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs font-medium text-zinc-500 hover:underline"
      >
        {open ? "Hide settings" : "Group settings"}
      </button>

      {open && (
        <div className="mt-2 space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <label className="flex items-center justify-between text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">
              Mirror messages to SMS
            </span>
            <input
              type="checkbox"
              checked={mirror}
              disabled={saving}
              onChange={(e) => toggle("sms_mirror_opt_in", e.target.checked)}
              className="rounded border-zinc-300"
            />
          </label>

          <label className="flex items-center justify-between text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">
              Notify me by SMS
            </span>
            <input
              type="checkbox"
              checked={notify}
              disabled={saving}
              onChange={(e) => toggle("sms_notify_opt_in", e.target.checked)}
              className="rounded border-zinc-300"
            />
          </label>

          <label className="flex items-center justify-between text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">
              Mute (no notifications)
            </span>
            <input
              type="checkbox"
              checked={muted}
              disabled={saving}
              onChange={(e) => toggle("is_muted", e.target.checked)}
              className="rounded border-zinc-300"
            />
          </label>

          <p className="text-[11px] text-zinc-400">
            SMS mirror sends your in-app messages as SMS. SMS notify sends you
            an SMS when others post.
          </p>
        </div>
      )}
    </div>
  );
}
