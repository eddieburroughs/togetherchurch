import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

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

      <div className="mt-12">
        <ContactForm />
      </div>
    </div>
  );
}
