import { prisma } from "@/lib/db";
import { createCalendarEvent, cancelCalendarEvent } from "@/lib/integrations/outlook";
import { hasSufficientNotice } from "@/lib/lesson-notice";

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

// Cancels a scheduled lesson. Sufficient notice (see lib/lesson-notice.ts) returns the credit
// to the enrollment so it can be rebooked; insufficient notice forfeits it — the lesson is
// still removed from the calendar, but lessonsUsed does not go back down.
export async function cancelLesson(lessonId: string, clientId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { enrollment: true },
  });

  if (!lesson || lesson.enrollment.clientId !== clientId) {
    throw new BookingError("Lesson not found.", 404);
  }

  if (lesson.status !== "SCHEDULED") {
    throw new BookingError("This lesson can't be canceled.", 400);
  }

  const sufficientNotice = hasSufficientNotice(lesson.scheduledStart);

  if (lesson.outlookEventId) {
    await cancelCalendarEvent(lesson.outlookEventId);
  }

  await prisma.$transaction(async (tx) => {
    await tx.lesson.update({
      where: { id: lesson.id },
      data: { status: sufficientNotice ? "CANCELED" : "FORFEITED" },
    });
    if (sufficientNotice) {
      await tx.enrollment.update({
        where: { id: lesson.enrollmentId },
        data: { lessonsUsed: { decrement: 1 } },
      });
    }
  });

  return { forfeited: !sufficientNotice };
}

// Moves a scheduled lesson to a new slot, reusing the same credit — unless it's inside the
// notice window, in which case (per policy) it's forfeited instead of rescheduled for free.
export async function rescheduleLesson(
  lessonId: string,
  clientId: string,
  newSlot: { start: Date; end: Date }
) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { enrollment: { include: { dog: true, service: true, client: true } } },
  });

  if (!lesson || lesson.enrollment.clientId !== clientId) {
    throw new BookingError("Lesson not found.", 404);
  }

  if (lesson.status !== "SCHEDULED") {
    throw new BookingError("This lesson can't be rescheduled.", 400);
  }

  const sufficientNotice = hasSufficientNotice(lesson.scheduledStart);

  if (!sufficientNotice) {
    if (lesson.outlookEventId) {
      await cancelCalendarEvent(lesson.outlookEventId);
    }
    await prisma.lesson.update({ where: { id: lesson.id }, data: { status: "FORFEITED" } });
    throw new BookingError(
      "This lesson was inside the notice window, so it has been forfeited rather than rescheduled.",
      409
    );
  }

  const expectedMinutes = lessonLengthFor(lesson.enrollment.dog.weightClass, lesson.enrollment.service);
  const actualMinutes = (newSlot.end.getTime() - newSlot.start.getTime()) / 60_000;
  if (actualMinutes !== expectedMinutes) {
    throw new BookingError(
      `This program's lesson length for ${lesson.enrollment.dog.name} is ${expectedMinutes} minutes.`,
      400
    );
  }

  if (lesson.outlookEventId) {
    await cancelCalendarEvent(lesson.outlookEventId);
  }

  const { outlookEventId } = await createCalendarEvent({
    start: newSlot.start.toISOString(),
    end: newSlot.end.toISOString(),
    subject: `Lesson — ${lesson.enrollment.dog.name} (${lesson.enrollment.client.firstName} ${lesson.enrollment.client.lastName})`,
    attendeeEmail: lesson.enrollment.client.email,
    attendeeName: `${lesson.enrollment.client.firstName} ${lesson.enrollment.client.lastName}`,
  });

  return prisma.$transaction(async (tx) => {
    const newLesson = await tx.lesson.create({
      data: {
        enrollmentId: lesson.enrollmentId,
        scheduledStart: newSlot.start,
        scheduledEnd: newSlot.end,
        outlookEventId,
      },
    });
    await tx.lesson.update({
      where: { id: lesson.id },
      data: { status: "RESCHEDULED", rescheduledToId: newLesson.id },
    });
    return newLesson;
  });
}
