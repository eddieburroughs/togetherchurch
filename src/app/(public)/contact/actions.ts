"use server";

import nodemailer from "nodemailer";
import { ENV } from "@/lib/env";

interface ContactState {
  success: boolean;
  error: string;
}

export async function submitContactForm(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const church = (formData.get("church") as string)?.trim();
  const size = (formData.get("size") as string) || "Not specified";
  const message = (formData.get("message") as string)?.trim();

  if (!name || !email) {
    return { success: false, error: "Name and email are required." };
  }

  if (!ENV.SMTP_HOST) {
    // If SMTP not configured, log and return success anyway
    console.log("[contact] Form submission (SMTP not configured):", {
      name,
      email,
      church,
      size,
      message,
    });
    return { success: true, error: "" };
  }

  try {
    const transport = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: Number(ENV.SMTP_PORT),
      auth: { user: ENV.SMTP_USER, pass: ENV.SMTP_PASS },
    });

    await transport.sendMail({
      from: ENV.EMAIL_FROM,
      to: ENV.EMAIL_FROM,
      replyTo: email,
      subject: `[TogetherChurch] Contact from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Church: ${church || "Not provided"}`,
        `Size: ${size}`,
        `Message:\n${message || "No message provided"}`,
      ].join("\n"),
    });

    return { success: true, error: "" };
  } catch (err) {
    console.error("[contact] Failed to send email:", err);
    return { success: false, error: "Something went wrong. Please try again or email us directly." };
  }
}
