import { ENV } from "@/lib/env";

/**
 * Send a single SMS via the Twilio REST API.
 * Returns the Twilio message SID on success.
 */
export async function sendSms(to: string, body: string): Promise<string> {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = ENV;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    throw new Error("Twilio is not configured.");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

  const params = new URLSearchParams({
    To: to,
    From: TWILIO_PHONE_NUMBER,
    Body: body,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Twilio error ${res.status}: ${(err as { message?: string }).message ?? res.statusText}`,
    );
  }

  const data = (await res.json()) as { sid: string };
  return data.sid;
}

export function isTwilioConfigured(): boolean {
  return Boolean(
    ENV.TWILIO_ACCOUNT_SID &&
      ENV.TWILIO_AUTH_TOKEN &&
      ENV.TWILIO_PHONE_NUMBER,
  );
}
