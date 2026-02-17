import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateIcsCalendar, type IcsEvent } from "@/features/events/lib/ics";

/**
 * Public ICS calendar feed.
 * GET /api/ics/[churchSlug].ics
 *
 * Served on the canonical app host (com.togetherchurch.app).
 * No auth required — calendar apps need public access.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug: rawSlug } = await params;
  // Strip .ics extension
  const slug = rawSlug.replace(/\.ics$/, "");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return new NextResponse("Service unavailable", { status: 503 });
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Look up church by slug
  const { data: church } = await supabase
    .from("churches")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!church) {
    return new NextResponse("Church not found", { status: 404 });
  }

  // Get upcoming events (next 12 months)
  const yearFromNow = new Date();
  yearFromNow.setFullYear(yearFromNow.getFullYear() + 1);

  const { data: events } = await supabase
    .from("events")
    .select("id, title, description, location, starts_at, ends_at")
    .eq("church_id", church.id)
    .gte("starts_at", new Date().toISOString())
    .lte("starts_at", yearFromNow.toISOString())
    .order("starts_at");

  const icsEvents: IcsEvent[] = (events ?? []).map((e) => ({
    uid: `${e.id}@togetherchurch.app`,
    title: e.title,
    description: e.description,
    location: e.location,
    startsAt: new Date(e.starts_at),
    endsAt: e.ends_at ? new Date(e.ends_at) : null,
  }));

  const icsContent = generateIcsCalendar(
    `${church.name} Events`,
    icsEvents,
  );

  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${slug}.ics"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
