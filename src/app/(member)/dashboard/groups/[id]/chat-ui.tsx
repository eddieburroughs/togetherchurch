"use client";

import { useActionState, useRef, useEffect } from "react";
import { postChatMessage } from "@/features/groups/server/actions";

interface Message {
  id: string;
  senderName: string;
  senderUserId: string | null;
  source: "app" | "sms";
  body: string;
  createdAt: string;
}

export function ChatUI({
  groupId,
  currentUserId,
  initialMessages,
}: {
  groupId: string;
  currentUserId: string;
  initialMessages: Message[];
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [error, formAction, pending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      const body = (formData.get("message") as string)?.trim();
      if (!body) return null;
      try {
        await postChatMessage(groupId, body);
        if (inputRef.current) inputRef.current.value = "";
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Failed to send.";
      }
    },
    null,
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialMessages.length]);

  return (
    <div>
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
        <div className="h-80 overflow-y-auto p-3">
          {initialMessages.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">
              No messages yet. Start the conversation!
            </p>
          )}
          <div className="space-y-3">
            {initialMessages.map((msg) => {
              const isMe = msg.senderUserId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      isMe
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    }`}
                  >
                    {!isMe && (
                      <p className="mb-0.5 text-xs font-semibold opacity-70">
                        {msg.senderName}
                        {msg.source === "sms" && (
                          <span className="ml-1 text-[10px] opacity-60">
                            via SMS
                          </span>
                        )}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{msg.body}</p>
                  </div>
                  <span className="mt-0.5 text-[10px] text-zinc-400">
                    {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
          <div ref={bottomRef} />
        </div>

        <form
          action={formAction}
          className="flex border-t border-zinc-200 dark:border-zinc-800"
        >
          <input
            ref={inputRef}
            name="message"
            type="text"
            placeholder="Type a message..."
            autoComplete="off"
            className="flex-1 border-none bg-transparent px-3 py-2 text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            {pending ? "..." : "Send"}
          </button>
        </form>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
