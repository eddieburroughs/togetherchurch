import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateIcsCalendar, type IcsEvent } from "@/features/events/lib/ics";

/**
 * Single-event ICS download.
 * GET /api/ics/download?eventId=<uuid>
 *
 * Returns an .ics file for the specified event. No auth required so
 * the download link works regardless of login state.
 */
export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return new NextResponse("Missing eventId", { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return new NextResponse("Service unavailable", { status: 503 });
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: event } = await supabase
    .from("events")
    .select("id, title, description, location, starts_at, ends_at")
    .eq("id", eventId)
    .single();

  if (!event) {
    return new NextResponse("Event not found", { status: 404 });
  }

  const icsEvent: IcsEvent = {
    uid: `${event.id}@togetherchurch.app`,
    title: event.title,
    description: event.description,
    location: event.location,
    startsAt: new Date(event.starts_at),
    endsAt: event.ends_at ? new Date(event.ends_at) : null,
  };

  const icsContent = generateIcsCalendar(event.title, [icsEvent]);

  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="event.ics"`,
    },
  });
}
