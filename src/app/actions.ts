"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { createLeadAssessmentSignup, signupSchema, SignupError } from "@/lib/signup";
import { bookLesson, cancelLesson, rescheduleLesson, BookingError } from "@/lib/booking";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function loginAction(_prevState: string | null, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return "Invalid email or password.";
    }
    throw err;
  }
  return null;
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function signupAction(_prevState: string | null, formData: FormData) {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    dogName: formData.get("dogName"),
    dogWeightLbs: Number(formData.get("dogWeightLbs")),
  });

  if (!parsed.success) {
    return "Please fill out every field correctly.";
  }

  try {
    await createLeadAssessmentSignup(parsed.data);
  } catch (err) {
    if (err instanceof SignupError) return err.message;
    console.error(err);
    return "Something went wrong creating your account.";
  }

  const signInResult = await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirect: false,
  });
  if (signInResult?.error) {
    return "Account created — please log in.";
  }

  redirect("/dashboard");
}

export async function bookLessonAction(
  enrollmentId: string,
  slot: { start: string; end: string }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  try {
    await bookLesson(enrollmentId, session.user.id, {
      start: new Date(slot.start),
      end: new Date(slot.end),
    });
  } catch (err) {
    if (err instanceof BookingError) return { error: err.message };
    throw err;
  }
  return { error: null };
}

export async function cancelLessonAction(lessonId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  try {
    const result = await cancelLesson(lessonId, session.user.id);
    revalidatePath("/dashboard");
    return { error: null, forfeited: result.forfeited };
  } catch (err) {
    if (err instanceof BookingError) return { error: err.message, forfeited: false };
    throw err;
  }
}

export async function rescheduleLessonAction(
  lessonId: string,
  slot: { start: string; end: string }
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  try {
    await rescheduleLesson(lessonId, session.user.id, {
      start: new Date(slot.start),
      end: new Date(slot.end),
    });
  } catch (err) {
    if (err instanceof BookingError) return { error: err.message };
    throw err;
  }
  revalidatePath("/dashboard");
  return { error: null };
}

export async function sendMessageAction(_prevState: string | null, formData: FormData) {
  const session = await auth();
  if (!session?.user) return "Unauthorized";

  const body = (formData.get("body") as string | null)?.trim();
  if (!body) return "Message can't be empty.";

  // Staff replying to a client's thread pass the client's id; clients always write to their
  // own thread regardless of what's in the form.
  const threadClientId =
    session.user.role === "ADMIN"
      ? (formData.get("threadClientId") as string) || session.user.id
      : session.user.id;

  await prisma.message.create({
    data: { senderId: session.user.id, threadClientId, body },
  });

  revalidatePath(session.user.role === "ADMIN" ? `/admin/messages/${threadClientId}` : "/dashboard/messages");
  return null;
}

export async function createServiceAction(_prevState: string | null, formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return "Unauthorized";

  const priceDollars = Number(formData.get("price"));
  const lessonCount = Number(formData.get("lessonCount"));
  const lessonLengthMinutesSmall = Number(formData.get("lessonLengthMinutesSmall"));
  const lessonLengthMinutesLarge = Number(formData.get("lessonLengthMinutesLarge"));

  if (
    !Number.isFinite(priceDollars) ||
    !Number.isFinite(lessonCount) ||
    !Number.isFinite(lessonLengthMinutesSmall) ||
    !Number.isFinite(lessonLengthMinutesLarge)
  ) {
    return "Please fill out every field with a valid number.";
  }

  await prisma.service.create({
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      priceCents: Math.round(priceDollars * 100),
      lessonCount,
      lessonLengthMinutesSmall,
      lessonLengthMinutesLarge,
      isAssessment: formData.get("isAssessment") === "on",
    },
  });

  revalidatePath("/admin/services");
  revalidatePath("/shop");
  return null;
}
