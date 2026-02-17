import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "TogetherChurch.app | A church app for communication, care, and community",
  description:
    "Simple tools for churches to manage people, send texts and emails, organize events, run meal trains, and support kids check-in.",
};

const APP_HOST =
  process.env.APP_CANONICAL_HOST ?? "com.togetherchurch.app";
const APP_URL = `https://${APP_HOST}/login`;

const FEATURES = [
  {
    heading: "Know who\u2019s in your church\u2014without messy spreadsheets.",
    body: "Manage people, households, and tags. Import your list in minutes and stay organized as you grow.",
    highlights: [
      "People directory + households",
      "Tags for quick groups (Guests, Youth, Volunteers)",
      "CSV import wizard with de-duplication",
    ],
    label: "Connect People",
  },
  {
    heading: "Reach the right people at the right time.",
    body: "Send email and text messages to your whole church\u2014or just the exact group you need. Templates and logs keep it simple.",
    highlights: [
      "SMS + Email broadcasts",
      "Send to Everyone or Tags",
      "Templates + send history",
      "Usage-based messaging (no bundled guesswork)",
    ],
    label: "Communicate Clearly",
  },
  {
    heading: "Events your church can actually keep up with.",
    body: "Create events, collect RSVPs, and help members add events to their calendars in one tap.",
    highlights: [
      "Events + RSVPs",
      "Add-to-calendar links",
      "Subscribe-to-calendar feed (so families stay in sync)",
    ],
    label: "Events & Calendar",
  },
  {
    heading: "Make it easy to belong\u2014and to help.",
    body: "Groups include in-app chat, and your members can opt in to text updates. Plus meal trains for families who need care.",
    highlights: [
      "Groups + chat",
      "Optional SMS bridge (member opt-in)",
      "Meal trains (\u201CTakeThemAMeal\u201D-style)",
    ],
    label: "Community & Care",
  },
  {
    heading: "A smoother Sunday starts at check-in.",
    body: "Secure check-in, pickup codes, and label printing\u2014so families feel confident and your team feels prepared.",
    highlights: [
      "Check-in/out tracking",
      "Pickup codes",
      "Label printing with 2\u20133 templates",
    ],
    label: "Kids Check-In & Safety",
  },
  {
    heading: "Simple today\u2014ready for tomorrow.",
    body: "Enable campuses when you need them. Add features as your church grows.",
    highlights: [
      "Optional campuses / multi-site",
      "Admin + leader roles",
      "Feature controls by plan",
    ],
    label: "Grow Without Outgrowing Your Tools",
  },
];

const TESTIMONIALS = [
  "\u201CWe finally stopped juggling 5 different tools.\u201D",
  "\u201COur follow-up got so much faster\u2014and our volunteers love it.\u201D",
  "\u201CThe meal train feature alone made it worth it.\u201D",
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pb-16 pt-20 text-center sm:pt-28">
        <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          A church app that helps you care for people and communicate with
          confidence.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          From visitors to volunteers, events to meal trains&mdash;TogetherChurch.app
          keeps your church connected without the overwhelm.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a
            href={APP_URL}
            className="rounded-full bg-zinc-900 px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Start your church
          </a>
          <Link
            href="/pricing"
            className="rounded-full border border-zinc-300 px-7 py-3 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            See pricing
          </Link>
        </div>
        <p className="mt-4 text-xs text-zinc-400">
          No contracts. Upgrade anytime. Messaging is usage-based, so you only
          pay for what you send.
        </p>
      </section>

      {/* Trust / who it's for */}
      <section className="border-y border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Built for real churches&mdash;small, growing, and multi-site.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">
            Whether you&rsquo;re shepherding 40 people or coordinating 4 campuses,
            you need tools that feel simple, supportive, and dependable.
          </p>
          <ul className="mx-auto mt-8 max-w-md space-y-3 text-left text-sm text-zinc-700 dark:text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-zinc-400">&bull;</span>
              Keep everyone informed (without chasing people down)
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-zinc-400">&bull;</span>
              Welcome guests and follow up faster
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-zinc-400">&bull;</span>
              Make events smoother
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-zinc-400">&bull;</span>
              Organize groups and care
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-zinc-400">&bull;</span>
              Keep kids check-in secure and simple
            </li>
          </ul>
        </div>
      </section>

      {/* Feature buckets */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <div className="space-y-20">
          {FEATURES.map((feature, i) => (
            <div
              key={i}
              className={`flex flex-col gap-8 md:flex-row md:items-start ${
                i % 2 === 1 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  {feature.label}
                </p>
                <h3 className="mt-2 text-2xl font-bold tracking-tight">
                  {feature.heading}
                </h3>
                <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                  {feature.body}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {feature.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <span className="mt-0.5 text-zinc-400">&bull;</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-1 items-center justify-center">
                <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-400 dark:border-zinc-700">
                  {feature.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="grid gap-8 sm:grid-cols-3">
            {TESTIMONIALS.map((quote, i) => (
              <blockquote
                key={i}
                className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
              >
                <p>{quote}</p>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Ready to bring it all together?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-zinc-600 dark:text-zinc-400">
          Start with the plan that fits your church today. Add features as you
          grow.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/pricing"
            className="rounded-full border border-zinc-300 px-7 py-3 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            View pricing
          </Link>
          <a
            href={APP_URL}
            className="rounded-full bg-zinc-900 px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Start your church
          </a>
        </div>
      </section>
    </>
  );
}
