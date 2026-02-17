import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | TogetherChurch.app",
  description:
    "Transparent pricing based on attendance. Messaging is usage-based so you only pay for what you send.",
};

const APP_HOST =
  process.env.APP_CANONICAL_HOST ?? "com.togetherchurch.app";
const APP_URL = `https://${APP_HOST}/login`;

interface Plan {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Under 150",
    price: "$49",
    period: "/month",
    tagline:
      "Best for smaller churches that want simple organization and communication.",
    features: [
      "People + households + tags",
      "Announcements feed",
      "Events + RSVPs + calendar tools",
      "Forms (I\u2019m New, Prayer) + submissions inbox",
      "External giving link + giving partner directory",
      "Basic admin + leader roles",
      "Messaging enabled (usage-based)",
    ],
  },
  {
    name: "151\u2013500",
    price: "$99",
    period: "/month",
    tagline:
      "Best for growing churches building community and care systems.",
    features: [
      "Everything in Under 150, plus:",
      "Groups + in-app chat",
      "Push notifications",
      "Optional SMS bridge (member opt-in)",
      "Meal trains (care sign-ups)",
    ],
    highlight: true,
  },
  {
    name: "501\u2013800",
    price: "$149",
    period: "/month",
    tagline:
      "Best for churches needing stronger Sunday operations and event organization.",
    features: [
      "Everything above, plus:",
      "Kids check-in + pickup codes",
      "Label printing (2\u20133 templates)",
      "Ticketing (free tickets)",
      "Paid tickets available after Stripe Connect",
    ],
  },
  {
    name: "801+",
    price: "$199",
    period: "/month",
    tagline:
      "Best for high-volume communication and larger team workflows.",
    features: [
      "Everything above, plus:",
      "Priority support options (optional)",
      "Advanced operational settings (as released)",
    ],
  },
  {
    name: "Multi-site",
    price: "$299",
    period: "/month",
    tagline:
      "For churches with multiple campuses or centralized leadership.",
    features: [
      "Everything in the 801+ tier",
      "Campus management",
      "Campus-aware filters across the app",
      "Role structures for campus leaders",
    ],
  },
];

const COMPARISON_FEATURES = [
  { name: "People + Households + Tags", tiers: [true, true, true, true, true] },
  { name: "CSV Import Wizard", tiers: [true, true, true, true, true] },
  { name: "Announcements Feed", tiers: [true, true, true, true, true] },
  { name: "Events + RSVPs + Calendar", tiers: [true, true, true, true, true] },
  { name: "Forms + Submissions Inbox", tiers: [true, true, true, true, true] },
  { name: "External Giving Link", tiers: [true, true, true, true, true] },
  { name: "SMS + Email Messaging (usage-based)", tiers: [true, true, true, true, true] },
  { name: "Groups + In-app Chat", tiers: [false, true, true, true, true] },
  { name: "Optional SMS Bridge for Groups", tiers: [false, true, true, true, true] },
  { name: "Care Meals (Meal Trains)", tiers: [false, true, true, true, true] },
  { name: "Kids Check-In", tiers: [false, false, true, true, true] },
  { name: "Label Printing Templates", tiers: [false, false, true, true, true] },
  { name: "Ticketing (Free tickets)", tiers: [false, false, true, true, true] },
  { name: "Ticketing (Paid via Stripe Connect)", tiers: [false, false, true, true, true] },
  { name: "Campuses / Multi-site tools", tiers: [false, false, false, false, true] },
];

const TIER_NAMES = ["Under 150", "151\u2013500", "501\u2013800", "801+", "Multi-site"];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Simple pricing based on church size.
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-zinc-600 dark:text-zinc-400">
          Messaging is usage-based, so you only pay for what you send.
        </p>
      </div>

      {/* Plan cards */}
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl border p-6 ${
              plan.highlight
                ? "border-zinc-900 ring-1 ring-zinc-900 dark:border-zinc-100 dark:ring-zinc-100"
                : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold">{plan.price}</span>
              <span className="text-sm text-zinc-500">{plan.period}</span>
            </div>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              {plan.tagline}
            </p>
            <a
              href={APP_URL}
              className={`mt-6 block rounded-full py-2.5 text-center text-sm font-medium transition-colors ${
                plan.highlight
                  ? "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                  : "border border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              }`}
            >
              Start your church
            </a>
            <ul className="mt-6 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Messaging explanation */}
      <div className="mt-16 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-lg font-bold">Usage-based messaging</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          SMS + Email are billed based on usage. SMS is billed per segment (and
          per MMS) using your messaging provider rates (via Twilio). Email is
          billed per send using your email provider/SMTP configuration.
        </p>
        <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Why usage-based?
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Because churches shouldn&rsquo;t pay for messages they don&rsquo;t
          send. A typical church sending 2&ndash;4 texts per month to their
          congregation can keep messaging costs very low.
        </p>
      </div>

      {/* Ticketing fees */}
      <div className="mt-6 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-lg font-bold">Ticketing fees</h2>
        <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
          <li>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Free tickets:
            </span>{" "}
            no additional platform fee
          </li>
          <li>
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              Paid tickets:
            </span>{" "}
            standard Stripe processing fees apply, plus an optional platform fee
            if you choose to set one (you can set it to $0 to start)
          </li>
        </ul>
      </div>

      {/* Comparison table */}
      <div className="mt-16">
        <h2 className="text-xl font-bold tracking-tight">
          Compare plans at a glance
        </h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="pb-3 pr-4 font-medium text-zinc-500">
                  Feature
                </th>
                {TIER_NAMES.map((t) => (
                  <th
                    key={t}
                    className="pb-3 text-center font-medium text-zinc-500"
                  >
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_FEATURES.map((row) => (
                <tr
                  key={row.name}
                  className="border-b border-zinc-100 dark:border-zinc-800/50"
                >
                  <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">
                    {row.name}
                  </td>
                  {row.tiers.map((included, i) => (
                    <td key={i} className="py-3 text-center">
                      {included ? (
                        <svg
                          className="mx-auto h-4 w-4 text-zinc-700 dark:text-zinc-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span className="text-zinc-300 dark:text-zinc-700">
                          &mdash;
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 text-center">
        <a
          href={APP_URL}
          className="inline-block rounded-full bg-zinc-900 px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Start your church
        </a>
      </div>
    </div>
  );
}
