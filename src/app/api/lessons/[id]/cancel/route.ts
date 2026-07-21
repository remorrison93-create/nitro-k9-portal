import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cancelLesson, BookingError } from "@/lib/booking";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/lessons/[id]/cancel">
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const result = await cancelLesson(id, session.user.id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Cancel failed." }, { status: 500 });
  }
}
