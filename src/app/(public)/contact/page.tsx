import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | TogetherChurch.app",
  description:
    "Get in touch with us to find the right plan for your church.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          We&rsquo;d love to help your church get started.
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Tell us your church size and what you need most&mdash;communication,
          groups, kids check-in, events. We&rsquo;ll point you to the right
          plan.
        </p>
      </div>

      <div className="mt-12 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <form className="space-y-5">
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
              <option value="under_150">Under 150</option>
              <option value="151_500">151&ndash;500</option>
              <option value="501_800">501&ndash;800</option>
              <option value="801_plus">801+</option>
              <option value="multisite">Multi-site</option>
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
          <button
            type="submit"
            className="w-full rounded-full bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Send message
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
    </div>
  );
}
