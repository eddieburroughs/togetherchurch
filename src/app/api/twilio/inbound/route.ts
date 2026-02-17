import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Twilio inbound SMS webhook.
 * POST /api/twilio/inbound
 *
 * Handles STOP / START / HELP keywords to manage SMS opt-out.
 * Twilio sends form-encoded POST data.
 */
export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return new NextResponse("Service unavailable", { status: 503 });
  }

  const formData = await request.formData();
  const from = (formData.get("From") as string) ?? "";
  const body = ((formData.get("Body") as string) ?? "").trim().toUpperCase();

  if (!from) {
    return new NextResponse("Missing From", { status: 400 });
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Normalize phone — strip any formatting for matching
  const phone = from.replace(/\s+/g, "");

  if (body === "STOP" || body === "UNSUBSCRIBE") {
    // Set sms_opt_out = true for matching profiles
    await supabase
      .from("profiles")
      .update({ sms_opt_out: true, updated_at: new Date().toISOString() })
      .eq("phone", phone);

    // Also try with the raw "from" value in case formatting differs
    if (phone !== from) {
      await supabase
        .from("profiles")
        .update({ sms_opt_out: true, updated_at: new Date().toISOString() })
        .eq("phone", from);
    }

    // Return TwiML with confirmation
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>You have been unsubscribed. Reply START to resubscribe.</Message></Response>`,
      { headers: { "Content-Type": "text/xml" } },
    );
  }

  if (body === "START" || body === "SUBSCRIBE") {
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

    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>You have been resubscribed to messages.</Message></Response>`,
      { headers: { "Content-Type": "text/xml" } },
    );
  }

  if (body === "HELP") {
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Reply STOP to unsubscribe or START to resubscribe.</Message></Response>`,
      { headers: { "Content-Type": "text/xml" } },
    );
  }

  // For any other message, return empty TwiML (no reply)
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { "Content-Type": "text/xml" } },
  );
}
