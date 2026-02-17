import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";
import { handleGroupSmsReply } from "@/features/groups/server/actions";
import { ENV } from "@/lib/env";

const TWIML_EMPTY = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

function twiml(message: string) {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`,
    { headers: { "Content-Type": "text/xml" } },
  );
}

/**
 * Validate Twilio request signature (X-Twilio-Signature header).
 * See: https://www.twilio.com/docs/usage/security#validating-requests
 */
function validateTwilioSignature(
  requestUrl: string,
  params: Record<string, string>,
  signature: string,
  authToken: string,
): boolean {
  // Sort params alphabetically and concatenate key + value
  const data =
    requestUrl +
    Object.keys(params)
      .sort()
      .reduce((acc, key) => acc + key + params[key], "");

  const expected = createHmac("sha1", authToken)
    .update(data, "utf-8")
    .digest("base64");

  return expected === signature;
}

/**
 * Twilio inbound SMS webhook.
 * POST /api/twilio/inbound
 *
 * 1. STOP / START / HELP — SMS opt-out management
 * 2. G-XXXXXX — group reply token routing
 * 3. Anything else — empty TwiML
 */
export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return new NextResponse("Service unavailable", { status: 503 });
  }

  // Verify Twilio signature if auth token is configured
  if (ENV.TWILIO_AUTH_TOKEN) {
    const signature = request.headers.get("x-twilio-signature") ?? "";
    const clonedData = await request.clone().formData();
    const params: Record<string, string> = {};
    clonedData.forEach((value, paramKey) => {
      params[paramKey] = String(value);
    });

    const requestUrl = request.url;
    if (!validateTwilioSignature(requestUrl, params, signature, ENV.TWILIO_AUTH_TOKEN)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const formData = await request.formData();
  const from = (formData.get("From") as string) ?? "";
  const rawBody = ((formData.get("Body") as string) ?? "").trim();
  const upperBody = rawBody.toUpperCase();

  if (!from) {
    return new NextResponse("Missing From", { status: 400 });
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const phone = from.replace(/\s+/g, "");

  // ── 1. Opt-out keywords ───────────────────────────────────────────────

  if (upperBody === "STOP" || upperBody === "UNSUBSCRIBE") {
    await supabase
      .from("profiles")
      .update({ sms_opt_out: true, updated_at: new Date().toISOString() })
      .eq("phone", phone);

    if (phone !== from) {
      await supabase
        .from("profiles")
        .update({ sms_opt_out: true, updated_at: new Date().toISOString() })
        .eq("phone", from);
    }

    return twiml("You have been unsubscribed. Reply START to resubscribe.");
  }

  if (upperBody === "START" || upperBody === "SUBSCRIBE") {
    await supabase
      .from("profiles")
      .update({ sms_opt_out: false, updated_at: new Date().toISOString() })
      .eq("phone", phone);

    if (phone !== from) {
      await supabase
        .from("profiles")
        .update({ sms_opt_out: false, updated_at: new Date().toISOString() })
        .eq("phone", from);
    }

    return twiml("You have been resubscribed to messages.");
  }

  if (upperBody === "HELP") {
    return twiml("Reply STOP to unsubscribe or START to resubscribe.");
  }

  // ── 2. Group reply tokens (G-XXXXXX <message>) ───────────────────────

  const tokenMatch = rawBody.match(/^(G-[A-Z0-9]{6})\s*([\s\S]*)/i);
  if (tokenMatch) {
    const token = tokenMatch[1].toUpperCase();
    const message = (tokenMatch[2] ?? "").trim();

    if (message) {
      const result = await handleGroupSmsReply(phone, token, message);
      if (result.handled) {
        return twiml("Message sent to group.");
      }
    }

    // Token not found, expired, or no message body
    return twiml("Could not deliver message. The reply code may have expired.");
  }

  // ── 3. Unrecognized ──────────────────────────────────────────────────

  return new NextResponse(TWIML_EMPTY, {
    headers: { "Content-Type": "text/xml" },
  });
}
