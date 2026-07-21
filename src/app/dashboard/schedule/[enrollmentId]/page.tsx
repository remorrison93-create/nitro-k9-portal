import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ScheduleClient } from "@/components/schedule-client";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const { enrollmentId } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { dog: true, service: true, invoice: true },
  });

  if (!enrollment || enrollment.clientId !== session.user.id) {
    notFound();
  }

  const lessonsLeft = enrollment.lessonsTotal - enrollment.lessonsUsed;

  return (
    <main className="mx-auto max-w-2xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Schedule a Lesson — {enrollment.dog.name}
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        {enrollment.service.name} · {lessonsLeft} of {enrollment.lessonsTotal} lessons remaining
      </p>

      <ScheduleClient enrollmentId={enrollment.id} lessonsLeft={lessonsLeft} />
    </main>
  );
}
