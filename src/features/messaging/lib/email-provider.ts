import nodemailer from "nodemailer";
import { ENV } from "@/lib/env";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: ENV.SMTP_HOST,
      port: parseInt(ENV.SMTP_PORT, 10),
      secure: parseInt(ENV.SMTP_PORT, 10) === 465,
      auth: {
        user: ENV.SMTP_USER,
        pass: ENV.SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Send a single email via SMTP.
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
): Promise<string> {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP is not configured.");
  }

  const info = await getTransporter().sendMail({
    from: ENV.EMAIL_FROM,
    to,
    subject,
    text: body,
  });

  return info.messageId ?? "";
}

export function isSmtpConfigured(): boolean {
  return Boolean(ENV.SMTP_HOST && ENV.SMTP_USER && ENV.SMTP_PASS);
}
