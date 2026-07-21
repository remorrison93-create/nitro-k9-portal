import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rescheduleLesson, BookingError } from "@/lib/booking";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/lessons/[id]/reschedule">
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();
  const start = new Date(body.start);
  const end = new Date(body.end);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid slot." }, { status: 400 });
  }

  try {
    const lesson = await rescheduleLesson(id, session.user.id, { start, end });
    return NextResponse.json({ lesson });
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Reschedule failed." }, { status: 500 });
  }
}
