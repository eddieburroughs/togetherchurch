import type { Metadata } from "next";
import { FaqAccordion } from "./faq-accordion";

export const metadata: Metadata = {
  title: "FAQ | TogetherChurch.app",
  description:
    "Answers about messaging costs, giving links, group SMS, kids check-in labels, ticketing, and multi-site.",
};

const ITEMS = [
  {
    question: "Do members need to download an app?",
    answer:
      "No\u2014TogetherChurch.app works in the browser on any phone. Members can also install it like an app (PWA) for quick access.",
  },
  {
    question: "Can we keep our current online giving provider?",
    answer:
      "Yes. Giving stays an external link, so you can use whatever provider you already have.",
  },
  {
    question: "What if we don\u2019t have online giving yet?",
    answer:
      "We\u2019ll guide you to set it up with trusted providers through our partner directory.",
  },
  {
    question: "How does usage-based messaging work?",
    answer:
      "You only pay for what you send. Text and email usage is tracked monthly and billed based on the provider\u2019s rates.",
  },
  {
    question: "Can people reply by text and have it show in the app?",
    answer:
      "Yes\u2014if they opt into the SMS bridge for that group. SMS replies appear in the group chat and notify others in the app.",
  },
  {
    question: "Can we do ticketed events?",
    answer:
      "Yes. You can run free ticket events right away. To sell paid tickets, connect Stripe Connect for payouts.",
  },
  {
    question: "Does it support kids label printers?",
    answer:
      "Yes. Kids check-in includes printable labels with multiple templates.",
  },
  {
    question: "Can we use campuses?",
    answer:
      "Yes\u2014Multi-site includes campus tools, and campus assignment can be Off / Optional / Required.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Can&rsquo;t find what you need?{" "}
          <a
            href="/contact"
            className="font-medium underline underline-offset-2"
          >
            Reach out
          </a>
          .
        </p>
      </div>

      <div className="mt-12">
        <FaqAccordion items={ITEMS} />
      </div>
    </div>
  );
}
