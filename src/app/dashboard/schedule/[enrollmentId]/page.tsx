import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ScheduleClient } from "@/components/schedule-client";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  params,
  searchParams,
}: {
  params: Promise<{ enrollmentId: string }>;
  searchParams: Promise<{ reschedule?: string }>;
}) {
  const { enrollmentId } = await params;
  const { reschedule } = await searchParams;
  const session = await auth();
  if (!session?.user) return null;

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { dog: true, service: true, invoice: true },
  });

  if (!enrollment || enrollment.clientId !== session.user.id) {
    notFound();
  }

  let reschedulingLesson = null;
  if (reschedule) {
    reschedulingLesson = await prisma.lesson.findUnique({ where: { id: reschedule } });
    if (
      !reschedulingLesson ||
      reschedulingLesson.enrollmentId !== enrollment.id ||
      reschedulingLesson.status !== "SCHEDULED"
    ) {
      notFound();
    }
  }

  const lessonsLeft = enrollment.lessonsTotal - enrollment.lessonsUsed;

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold text-brand">
        {reschedulingLesson ? "Reschedule Lesson" : "Schedule a Lesson"} — {enrollment.dog.name}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {enrollment.service.name} · {lessonsLeft} of {enrollment.lessonsTotal} lessons remaining
      </p>

      <ScheduleClient
        enrollmentId={enrollment.id}
        lessonsLeft={lessonsLeft}
        rescheduleLessonId={reschedulingLesson?.id}
      />
    </main>
  );
}
