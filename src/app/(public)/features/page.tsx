import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Features | TogetherChurch.app",
  description:
    "People, messaging, events, groups chat, meal trains, kids check-in, ticketing, and multi-site tools\u2014organized by plan.",
};

const SECTIONS = [
  {
    title: "People (Light ChMS)",
    items: [
      "People directory, households, tags",
      "CSV import wizard (map \u2192 preview \u2192 import)",
      "Campus-aware records (if enabled)",
    ],
  },
  {
    title: "Announcements",
    items: [
      "Member home feed",
      "Scheduled announcements",
      "Optional campus targeting",
    ],
  },
  {
    title: "Events & RSVPs",
    items: [
      "Events, featured events",
      "RSVP Yes/No/Maybe + export",
      "Add-to-calendar + calendar subscribe feed",
    ],
  },
  {
    title: "Forms",
    items: [
      "\u201CI\u2019m New\u201D connect card",
      "Prayer requests",
      "Admin submissions inbox + notifications",
    ],
  },
  {
    title: "Messaging",
    items: [
      "SMS + Email broadcasts",
      "Send to All or Tags",
      "Templates + send logs",
      "Usage-based pricing",
    ],
  },
  {
    title: "Groups",
    items: [
      "In-app group chat",
      "Push notifications",
      "Optional SMS bridge (opt-in per member)",
      "SMS replies appear in-app",
    ],
  },
  {
    title: "Care Meals (Meal Trains)",
    items: [
      "Create a care need",
      "Members sign up for slots/tasks",
      "Admin notifications",
    ],
  },
  {
    title: "Kids Check-In",
    items: [
      "Check-in/out, pickup codes",
      "Label printing (2\u20133 templates)",
    ],
  },
  {
    title: "Ticketing (Light Eventbrite)",
    items: [
      "Free tickets right away",
      "Paid tickets after connecting Stripe Connect",
      "QR check-in at the door",
      "Refund support",
    ],
  },
  {
    title: "Multi-site",
    items: [
      "Campus mode: Off / Optional / Required",
      "Campus-specific events, people, groups, check-in",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Everything your church needs to connect, communicate, and care.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-zinc-600 dark:text-zinc-400">
          Choose a plan based on attendance&mdash;and turn on the tools you need.
        </p>
      </div>

      <div className="mt-16 space-y-12">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            <h2 className="text-xl font-bold tracking-tight">
              {section.title}
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
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
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
