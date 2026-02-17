"use client";

import { useState, useActionState } from "react";
import {
  sendBroadcast,
  getRecipientCount,
} from "@/features/messaging/server/actions";

interface Template {
  id: string;
  channel: "sms" | "email";
  name: string;
  body: string;
}

interface Tag {
  id: string;
  name: string;
}

export function ComposeForm({
  templates,
  tags,
}: {
  templates: Template[];
  tags: Tag[];
}) {
  const [channel, setChannel] = useState<"sms" | "email">("sms");
  const [audienceType, setAudienceType] = useState<"all" | "tag">("all");
  const [tagId, setTagId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [step, setStep] = useState<"compose" | "confirm">("compose");
  const [recipientCount, setRecipientCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(false);

  const filteredTemplates = templates.filter((t) => t.channel === channel);

  async function handleConfirm() {
    if (!body.trim()) return;
    setLoadingCount(true);
    try {
      const count = await getRecipientCount({
        channel,
        audienceType,
        tagId: audienceType === "tag" ? tagId : undefined,
      });
      setRecipientCount(count);
      setStep("confirm");
    } catch {
      setRecipientCount(0);
      setStep("confirm");
    } finally {
      setLoadingCount(false);
    }
  }

  const [result, formAction, pending] = useActionState(
    async (
      _prev: { error: string | null; sent: number; failed: number } | null,
    ) => {
      try {
        const res = await sendBroadcast({
          channel,
          audienceType,
          tagId: audienceType === "tag" ? tagId : undefined,
          subject: channel === "email" ? subject : undefined,
          body,
        });
        return { error: null, sent: res.sent, failed: res.failed };
      } catch (e) {
        return {
          error: e instanceof Error ? e.message : "Something went wrong.",
          sent: 0,
          failed: 0,
        };
      }
    },
    null,
  );

  if (result && !result.error) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
        <p className="text-sm font-medium text-green-800 dark:text-green-300">
          Broadcast sent: {result.sent} delivered
          {result.failed > 0 && `, ${result.failed} failed`}.
        </p>
        <button
          onClick={() => {
            setStep("compose");
            setBody("");
            setSubject("");
          }}
          className="mt-3 text-sm text-green-700 underline dark:text-green-400"
        >
          Send another
        </button>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Confirm: Send {channel.toUpperCase()} to{" "}
            <strong>{recipientCount}</strong> recipient
            {recipientCount !== 1 ? "s" : ""}?
          </p>
          {channel === "email" && subject && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              Subject: {subject}
            </p>
          )}
          <p className="mt-2 whitespace-pre-wrap text-xs text-amber-700 dark:text-amber-400">
            {body.length > 200 ? body.slice(0, 200) + "..." : body}
          </p>
        </div>

        <div className="flex gap-2">
          <form action={formAction} className="flex-1">
            <button
              type="submit"
              disabled={pending || recipientCount === 0}
              className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              {pending ? "Sending..." : `Send to ${recipientCount} recipients`}
            </button>
          </form>
          <button
            onClick={() => setStep("compose")}
            disabled={pending}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Back
          </button>
        </div>

        {result?.error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-300">
            {result.error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Channel */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Channel
        </label>
        <div className="mt-1 flex gap-2">
          {(["sms", "email"] as const).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => {
                setChannel(ch);
                setBody("");
              }}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                channel === ch
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              }`}
            >
              {ch.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Audience */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Audience
        </label>
        <div className="mt-1 flex gap-2">
          <button
            type="button"
            onClick={() => setAudienceType("all")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              audienceType === "all"
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            All People
          </button>
          <button
            type="button"
            onClick={() => setAudienceType("tag")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              audienceType === "tag"
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            }`}
          >
            By Tag
          </button>
        </div>
      </div>

      {/* Tag selector */}
      {audienceType === "tag" && (
        <div>
          <label
            htmlFor="tag"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Select Tag
          </label>
          <select
            id="tag"
            value={tagId}
            onChange={(e) => setTagId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">Choose a tag...</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Template (optional) */}
      {filteredTemplates.length > 0 && (
        <div>
          <label
            htmlFor="template"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Template (optional)
          </label>
          <select
            id="template"
            onChange={(e) => {
              const tmpl = filteredTemplates.find(
                (t) => t.id === e.target.value,
              );
              if (tmpl) setBody(tmpl.body);
            }}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">Write custom...</option>
            {filteredTemplates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Subject (email only) */}
      {channel === "email" && (
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      )}

      {/* Body */}
      <div>
        <label
          htmlFor="body"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Message
        </label>
        <textarea
          id="body"
          rows={channel === "sms" ? 4 : 8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {channel === "sms" && (
          <p className="mt-1 text-xs text-zinc-400">
            {body.length} chars
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={
          !body.trim() ||
          loadingCount ||
          (audienceType === "tag" && !tagId)
        }
        className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {loadingCount ? "Loading recipients..." : "Preview & Confirm"}
      </button>
    </div>
  );
}
