// Microsoft Graph integration — reads availability from, and writes lessons to, the
// business's Outlook calendar.
//
// Real implementation notes for later:
// - Auth: app registration in Entra ID, OAuth client-credentials (application permissions,
//   Calendars.ReadWrite) so the app can act on the trainer's calendar without per-request
//   interactive login. Env: MS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET,
//   MS_GRAPH_CALENDAR_USER (the mailbox/UPN whose calendar is the source of truth).
// - Availability: GET /users/{MS_GRAPH_CALENDAR_USER}/calendar/getSchedule, or free/busy
//   view over /calendarView, sliced into `durationMinutes` slots against configured
//   working hours.
// - Booking: POST /users/{MS_GRAPH_CALENDAR_USER}/events to create the lesson event;
//   PATCH/DELETE the same event on cancel/reschedule.
//
// Everything here is a typed placeholder: with no MS_GRAPH_CLIENT_ID set, calls return
// generated mock slots / fake event ids instead of calling Graph.

const isConfigured = () => Boolean(process.env.MS_GRAPH_CLIENT_ID);

export interface AvailableSlot {
  start: string; // ISO 8601
  end: string; // ISO 8601
}

export async function getAvailableSlots(
  rangeStart: Date,
  rangeEnd: Date,
  durationMinutes: number
): Promise<AvailableSlot[]> {
  if (!isConfigured()) {
    console.warn("[outlook:placeholder] getAvailableSlots", {
      rangeStart,
      rangeEnd,
      durationMinutes,
    });
    return generateMockSlots(rangeStart, rangeEnd, durationMinutes);
  }

  // TODO: real call — GET /users/{MS_GRAPH_CALENDAR_USER}/calendarView + getSchedule.
  throw new Error("Outlook live integration not implemented yet.");
}

export interface CreateEventInput {
  start: string;
  end: string;
  subject: string;
  attendeeEmail: string;
  attendeeName: string;
}

export async function createCalendarEvent(
  input: CreateEventInput
): Promise<{ outlookEventId: string }> {
  if (!isConfigured()) {
    console.warn("[outlook:placeholder] createCalendarEvent", input);
    return { outlookEventId: `mock-event-${Date.now()}` };
  }

  // TODO: real call — POST /users/{MS_GRAPH_CALENDAR_USER}/events
  throw new Error("Outlook live integration not implemented yet.");
}

export async function cancelCalendarEvent(outlookEventId: string): Promise<void> {
  if (!isConfigured()) {
    console.warn("[outlook:placeholder] cancelCalendarEvent", outlookEventId);
    return;
  }

  // TODO: real call — DELETE /users/{MS_GRAPH_CALENDAR_USER}/events/{outlookEventId}
  throw new Error("Outlook live integration not implemented yet.");
}

// Business-hours 9am-5pm, every `durationMinutes`, next 5 weekdays — placeholder only.
function generateMockSlots(
  rangeStart: Date,
  rangeEnd: Date,
  durationMinutes: number
): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  const cursor = new Date(rangeStart);
  cursor.setMinutes(0, 0, 0);

  while (cursor < rangeEnd && slots.length < 20) {
    const day = cursor.getDay();
    const hour = cursor.getHours();
    if (day !== 0 && day !== 6 && hour >= 9 && hour < 17) {
      const start = new Date(cursor);
      const end = new Date(cursor.getTime() + durationMinutes * 60_000);
      slots.push({ start: start.toISOString(), end: end.toISOString() });
    }
    cursor.setMinutes(cursor.getMinutes() + durationMinutes);
  }

  return slots;
}
