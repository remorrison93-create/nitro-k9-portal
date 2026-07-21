// Cancellation/reschedule notice policy. Pure functions, no server-only imports, so this is
// safe to use from both server code (the actual enforcement, in lib/booking.ts) and client
// components (to show the deadline and decide whether to offer "Reschedule" at all).
//
// Rule is based on the day the LESSON falls on, not the day the client takes the action:
// weekday lessons need 72 hours notice, weekend lessons need a full 7 days.

export const WEEKDAY_NOTICE_HOURS = 72;
export const WEEKEND_NOTICE_HOURS = 24 * 7;

export function isWeekendLesson(scheduledStart: Date): boolean {
  const day = scheduledStart.getDay();
  return day === 0 || day === 6;
}

export function requiredNoticeHours(scheduledStart: Date): number {
  return isWeekendLesson(scheduledStart) ? WEEKEND_NOTICE_HOURS : WEEKDAY_NOTICE_HOURS;
}

export function noticeDeadline(scheduledStart: Date): Date {
  return new Date(scheduledStart.getTime() - requiredNoticeHours(scheduledStart) * 60 * 60 * 1000);
}

export function hasSufficientNotice(scheduledStart: Date, now: Date = new Date()): boolean {
  return now.getTime() <= noticeDeadline(scheduledStart).getTime();
}
