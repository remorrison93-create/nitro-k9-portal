import { NextResponse } from "next/server";
import { signupSchema, createLeadAssessmentSignup, SignupError } from "@/lib/signup";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { user, enrollment } = await createLeadAssessmentSignup(parsed.data);
    return NextResponse.json({ userId: user.id, enrollmentId: enrollment.id }, { status: 201 });
  } catch (err) {
    if (err instanceof SignupError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Signup failed." }, { status: 500 });
  }
}
