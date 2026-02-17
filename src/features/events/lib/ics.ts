/**
 * ICS (iCalendar) generation utilities.
 * Produces valid RFC 5545 output for calendar subscriptions and downloads.
 */

export interface IcsEvent {
  uid: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: Date;
  endsAt?: Date | null;
  url?: string;
}

function icsDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function generateIcsEvent(event: IcsEvent): string {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTART:${icsDate(event.startsAt)}`,
  ];

  if (event.endsAt) {
    lines.push(`DTEND:${icsDate(event.endsAt)}`);
  }

  lines.push(`SUMMARY:${escapeIcs(event.title)}`);

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeIcs(event.description)}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeIcs(event.location)}`);
  }
  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  lines.push(
    `DTSTAMP:${icsDate(new Date())}`,
    "END:VEVENT",
  );

  return lines.join("\r\n");
}

export function generateIcsCalendar(
  calendarName: string,
  events: IcsEvent[],
): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Together Church//Events//EN",
    `X-WR-CALNAME:${escapeIcs(calendarName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const event of events) {
    lines.push(generateIcsEvent(event));
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/**
 * Generates calendar links for a single event.
 */
export function getCalendarLinks(event: IcsEvent) {
  const start = icsDate(event.startsAt);
  const end = event.endsAt
    ? icsDate(event.endsAt)
    : icsDate(new Date(event.startsAt.getTime() + 60 * 60 * 1000)); // default 1h

  const title = encodeURIComponent(event.title);
  const location = encodeURIComponent(event.location ?? "");
  const description = encodeURIComponent(event.description ?? "");

  return {
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&location=${location}&details=${description}`,
    outlook: `https://outlook.live.com/calendar/0/action/compose?subject=${title}&startdt=${event.startsAt.toISOString()}&enddt=${(event.endsAt ?? new Date(event.startsAt.getTime() + 3600000)).toISOString()}&location=${location}&body=${description}`,
  };
}
