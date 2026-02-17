"use client";

import { useActionState } from "react";
import { submitContactForm } from "./actions";

const initial = { success: false, error: "" };

export function ContactForm() {
  const [state, action, pending] = useActionState(submitContactForm, initial);

  if (state.success) {
    return (
      <div className="rounded-xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
        <p className="text-lg font-medium">Thank you!</p>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          We&rsquo;ll be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
      <form action={action} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Your name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700"
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700"
          />
        </div>
        <div>
          <label
            htmlFor="church"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Church name
          </label>
          <input
            id="church"
            name="church"
            type="text"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700"
          />
        </div>
        <div>
          <label
            htmlFor="size"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Approximate attendance
          </label>
          <select
            id="size"
            name="size"
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700"
          >
            <option value="">Select&hellip;</option>
            <option value="Under 150">Under 150</option>
            <option value="151-500">151&ndash;500</option>
            <option value="501-800">501&ndash;800</option>
            <option value="801+">801+</option>
            <option value="Multi-site">Multi-site</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            What do you need most?
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700"
            placeholder="Communication, groups, kids check-in, events&hellip;"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {pending ? "Sending\u2026" : "Send message"}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-zinc-400">
        Or email us directly at{" "}
        <a
          href="mailto:hello@togetherchurch.app"
          className="underline underline-offset-2"
        >
          hello@togetherchurch.app
        </a>
      </p>
    </div>
  );
}
