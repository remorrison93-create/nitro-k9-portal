import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAvailableSlots } from "@/lib/integrations/outlook";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/enrollments/[id]/availability">
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: { service: true },
  });

  if (!enrollment || enrollment.clientId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const durationMinutes = enrollment.service.lessonLengthMinutes;

  const rangeStart = new Date();
  const rangeEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const slots = await getAvailableSlots(rangeStart, rangeEnd, durationMinutes);
  return NextResponse.json({ slots, durationMinutes });
}
