import { prisma } from "@/lib/db";
import { createCalendarEvent } from "@/lib/integrations/outlook";

export class BookingError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

// Central gate for "can this enrollment book another lesson right now", and the only place
// that creates a Lesson + decrements the remaining credit. Every booking path (client UI,
// future admin override, future mobile app) should go through this function rather than
// writing to the Lesson table directly, so the gating rules can't drift between callers.
export async function bookLesson(
  enrollmentId: string,
  clientId: string,
  slot: { start: Date; end: Date }
) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { dog: true, service: true, client: true, invoice: true },
  });

  if (!enrollment || enrollment.clientId !== clientId) {
    throw new BookingError("Enrollment not found.", 404);
  }

  if (enrollment.contractStatus !== "SIGNED") {
    throw new BookingError("Contract must be signed before scheduling.", 403);
  }

  if (!enrollment.invoice || enrollment.invoice.status === "DRAFT" || enrollment.invoice.status === "SENT") {
    throw new BookingError("Payment must be received before scheduling.", 403);
  }

  if (enrollment.lessonsUsed >= enrollment.lessonsTotal) {
    throw new BookingError("No lessons remaining on this program.", 403);
  }

  const expectedMinutes =
    enrollment.dog.weightClass === "OVER_35"
      ? enrollment.service.lessonLengthMinutesLarge
      : enrollment.service.lessonLengthMinutesSmall;

  const actualMinutes = (slot.end.getTime() - slot.start.getTime()) / 60_000;
  if (actualMinutes !== expectedMinutes) {
    throw new BookingError(
      `This program's lesson length for ${enrollment.dog.name} is ${expectedMinutes} minutes.`,
      400
    );
  }

  const { outlookEventId } = await createCalendarEvent({
    start: slot.start.toISOString(),
    end: slot.end.toISOString(),
    subject: `Lesson — ${enrollment.dog.name} (${enrollment.client.firstName} ${enrollment.client.lastName})`,
    attendeeEmail: enrollment.client.email,
    attendeeName: `${enrollment.client.firstName} ${enrollment.client.lastName}`,
  });

  const [lesson] = await prisma.$transaction([
    prisma.lesson.create({
      data: {
        enrollmentId: enrollment.id,
        scheduledStart: slot.start,
        scheduledEnd: slot.end,
        outlookEventId,
      },
    }),
    prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { lessonsUsed: { increment: 1 } },
    }),
  ]);

  return lesson;
}

export function lessonLengthFor(
  dogWeightClass: "UNDER_35" | "OVER_35",
  service: { lessonLengthMinutesSmall: number; lessonLengthMinutesLarge: number }
) {
  return dogWeightClass === "OVER_35"
    ? service.lessonLengthMinutesLarge
    : service.lessonLengthMinutesSmall;
}
