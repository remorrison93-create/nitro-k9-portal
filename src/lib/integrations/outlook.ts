// Microsoft Graph integration — reads availability from, and writes lessons to, the
// business's Outlook calendar.
//
// Auth: app registration in Entra ID, OAuth client-credentials flow (application permissions,
// Calendars.ReadWrite) so the app can act on the calendar without per-request interactive
// login. Env: MS_GRAPH_TENANT_ID, MS_GRAPH_CLIENT_ID, MS_GRAPH_CLIENT_SECRET,
// MS_GRAPH_CALENDAR_USER (the mailbox/UPN whose calendar is the source of truth).
//
// Everything here is a typed placeholder until MS_GRAPH_CLIENT_ID is set: calls return
// generated mock slots / fake event ids instead of calling Graph.

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

const isConfigured = () => Boolean(process.env.MS_GRAPH_CLIENT_ID);

function calendarUser(): string {
  const user = process.env.MS_GRAPH_CALENDAR_USER;
  if (!user) throw new Error("MS_GRAPH_CALENDAR_USER is not set.");
  return user;
}

// Client-credentials tokens are valid ~1hr; cached in memory so warm serverless invocations
// don't re-authenticate on every call. A cold start just fetches a fresh one.
let cachedToken: { token: string; expiresAt: number } | null = null;

// JWT claims are base64url, not encrypted — readable without the signing key, only signature
// *verification* needs a secret. Used purely for diagnostic logging (which app roles/permissions
// Entra actually put on the token), never for trust decisions.
function decodeJwtClaims(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(Buffer.from(base64, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }

  const tenantId = process.env.MS_GRAPH_TENANT_ID;
  const clientId = process.env.MS_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId ?? "",
      client_secret: clientSecret ?? "",
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to get Microsoft Graph access token: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };

  const claims = decodeJwtClaims(data.access_token);
  console.warn("[outlook:diagnostic] acquired Graph token", {
    aud: claims?.aud,
    appid: claims?.appid,
    tid: claims?.tid,
    roles: claims?.roles,
  });

  return data.access_token;
}

async function graphFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Ask Graph to hand back event times already in UTC, matching how we store/compare
      // everything else, instead of the mailbox's own configured timezone.
      Prefer: 'outlook.timezone="UTC"',
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    // A 401 with an empty body (no JSON error object) means Graph's auth gateway rejected the
    // request before it ever reached calendar logic — the real reason lives in the
    // WWW-Authenticate header (standard OAuth behavior), not the body. Log it explicitly since
    // the thrown error's body-derived message is otherwise blank and unhelpful.
    console.warn("[outlook:diagnostic] Graph request failed", {
      path,
      status: res.status,
      wwwAuthenticate: res.headers.get("www-authenticate"),
      requestId: res.headers.get("request-id") ?? res.headers.get("client-request-id"),
      body,
    });
    throw new Error(`Microsoft Graph request failed: ${res.status} ${body}`);
  }
  return res;
}

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
    return generateBusinessHourSlots(rangeStart, rangeEnd, durationMinutes, []);
  }

  const params = new URLSearchParams({
    startDateTime: rangeStart.toISOString(),
    endDateTime: rangeEnd.toISOString(),
    $select: "start,end",
    $top: "250",
  });
  const res = await graphFetch(`/users/${encodeURIComponent(calendarUser())}/calendarView?${params}`);
  const data = (await res.json()) as {
    value: { start: { dateTime: string }; end: { dateTime: string } }[];
  };

  // With Prefer: outlook.timezone="UTC", Graph returns naive "no offset" datetime strings
  // that represent UTC — append Z so Date parses them as UTC instead of local time.
  const busy = data.value.map((e) => ({
    start: new Date(`${e.start.dateTime}Z`),
    end: new Date(`${e.end.dateTime}Z`),
  }));

  return generateBusinessHourSlots(rangeStart, rangeEnd, durationMinutes, busy);
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

  const res = await graphFetch(`/users/${encodeURIComponent(calendarUser())}/events`, {
    method: "POST",
    body: JSON.stringify({
      subject: input.subject,
      // dateTime must be offset-less when paired with an explicit timeZone.
      start: { dateTime: input.start.replace("Z", ""), timeZone: "UTC" },
      end: { dateTime: input.end.replace("Z", ""), timeZone: "UTC" },
      attendees: [
        {
          emailAddress: { address: input.attendeeEmail, name: input.attendeeName },
          type: "required",
        },
      ],
    }),
  });

  const data = (await res.json()) as { id: string };
  return { outlookEventId: data.id };
}

export async function cancelCalendarEvent(outlookEventId: string): Promise<void> {
  if (!isConfigured()) {
    console.warn("[outlook:placeholder] cancelCalendarEvent", outlookEventId);
    return;
  }

  await graphFetch(`/users/${encodeURIComponent(calendarUser())}/events/${outlookEventId}`, {
    method: "DELETE",
  });
}

interface BusyPeriod {
  start: Date;
  end: Date;
}

// Business-hours 9am-5pm weekdays, every `durationMinutes`, skipping anything that overlaps
// an existing (busy) event and anything already in the past.
function generateBusinessHourSlots(
  rangeStart: Date,
  rangeEnd: Date,
  durationMinutes: number,
  busy: BusyPeriod[]
): AvailableSlot[] {
  const slots: AvailableSlot[] = [];
  const now = new Date();
  const cursor = new Date(rangeStart);
  cursor.setMinutes(0, 0, 0);

  while (cursor < rangeEnd && slots.length < 20) {
    const day = cursor.getDay();
    const hour = cursor.getHours();
    if (day !== 0 && day !== 6 && hour >= 9 && hour < 17) {
      const start = new Date(cursor);
      const end = new Date(cursor.getTime() + durationMinutes * 60_000);
      const overlapsBusy = busy.some((b) => start < b.end && end > b.start);
      if (!overlapsBusy && start > now) {
        slots.push({ start: start.toISOString(), end: end.toISOString() });
      }
    }
    cursor.setMinutes(cursor.getMinutes() + durationMinutes);
  }

  return slots;
}
