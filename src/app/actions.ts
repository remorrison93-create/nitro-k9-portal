"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { createLeadAssessmentSignup, signupSchema, SignupError } from "@/lib/signup";
import { bookLesson, cancelLesson, rescheduleLesson, BookingError } from "@/lib/booking";
import { setContractStatus, setInvoiceStatusForEnrollment } from "@/lib/enrollment";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await auth();
  return session?.user.role === "ADMIN" ? session : null;
}

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

const MAX_BIO_LENGTH = 500;
const MAX_PHOTO_DATA_URL_LENGTH = 1_500_000; // client resizes before upload; this is just a backstop

export async function updateDogProfileAction(
  dogId: string,
  data: { bio: string; photoDataUrl: string | null }
) {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };

  const dog = await prisma.dog.findUnique({ where: { id: dogId } });
  if (!dog || dog.ownerId !== session.user.id) return { error: "Dog not found." };

  const bio = data.bio.trim().slice(0, MAX_BIO_LENGTH);
  const photoDataUrl = data.photoDataUrl;

  if (photoDataUrl && (!photoDataUrl.startsWith("data:image/") || photoDataUrl.length > MAX_PHOTO_DATA_URL_LENGTH)) {
    return { error: "That photo couldn't be saved — try a smaller image." };
  }

  await prisma.dog.update({
    where: { id: dog.id },
    data: {
      bio: bio || null,
      ...(photoDataUrl ? { photoUrl: photoDataUrl } : {}),
    },
  });

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
  const lessonLengthMinutes = Number(formData.get("lessonLengthMinutes"));

  if (!Number.isFinite(priceDollars) || !Number.isFinite(lessonCount)) {
    return "Please fill out every field with a valid number.";
  }
  if (lessonLengthMinutes !== 30 && lessonLengthMinutes !== 60) {
    return "Pick a lesson length.";
  }

  await prisma.service.create({
    data: {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      priceCents: Math.round(priceDollars * 100),
      lessonCount,
      lessonLengthMinutes,
      isAssessment: formData.get("isAssessment") === "on",
    },
  });

  revalidatePath("/admin/services");
  revalidatePath("/shop");
  return null;
}

export async function updateServiceAction(
  serviceId: string,
  data: {
    name: string;
    description: string;
    priceDollars: number;
    lessonCount: number;
    lessonLengthMinutes: number;
    isAssessment: boolean;
  }
) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return { error: "Unauthorized" };

  if (!data.name.trim()) return { error: "Name is required." };
  if (!Number.isFinite(data.priceDollars) || data.priceDollars < 0) {
    return { error: "Enter a valid price." };
  }
  if (!Number.isFinite(data.lessonCount) || data.lessonCount < 1) {
    return { error: "Enter a valid lesson count." };
  }
  if (data.lessonLengthMinutes !== 30 && data.lessonLengthMinutes !== 60) {
    return { error: "Pick a lesson length." };
  }

  await prisma.service.update({
    where: { id: serviceId },
    data: {
      name: data.name.trim(),
      description: data.description.trim() || null,
      priceCents: Math.round(data.priceDollars * 100),
      lessonCount: data.lessonCount,
      lessonLengthMinutes: data.lessonLengthMinutes,
      isAssessment: data.isAssessment,
    },
  });

  revalidatePath("/admin/services");
  revalidatePath("/shop");
  return { error: null };
}

export async function setServiceActiveAction(serviceId: string, active: boolean) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return { error: "Unauthorized" };

  // Soft delete rather than a hard DELETE: services stay linked from any existing enrollment
  // (the foreign key would reject a real delete anyway once a client has signed up for one),
  // and `active: false` already means "hidden from /shop and new signups" everywhere else in
  // the app — no other code needs to change for "removed" to mean this.
  await prisma.service.update({ where: { id: serviceId }, data: { active } });

  revalidatePath("/admin/services");
  revalidatePath("/shop");
  return { error: null };
}

// Admin assigns a program to a client's dog: creates the Enrollment (with the service's full
// lesson count as tentative, unusable credits) and a DRAFT invoice. Nothing is bookable until
// the contract/invoice checkboxes below mark it SIGNED + PAID — bookLesson() already enforces
// that gate, so no booking-side changes were needed for this.
export async function assignProgramAction(clientId: string, dogId: string, serviceId: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };

  const [dog, service] = await Promise.all([
    prisma.dog.findUnique({ where: { id: dogId } }),
    prisma.service.findUnique({ where: { id: serviceId } }),
  ]);
  if (!dog || dog.ownerId !== clientId) return { error: "That dog doesn't belong to this client." };
  if (!service) return { error: "Service not found." };

  const enrollment = await prisma.enrollment.create({
    data: { clientId, dogId, serviceId, lessonsTotal: service.lessonCount },
  });
  await prisma.invoice.create({
    data: { clientId, enrollmentId: enrollment.id, amountDueCents: service.priceCents },
  });

  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin/clients");
  return { error: null };
}

export async function setEnrollmentContractStatusAction(
  enrollmentId: string,
  status: "NOT_SENT" | "SENT" | "SIGNED"
) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };

  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) return { error: "Enrollment not found." };

  await setContractStatus(enrollmentId, status);
  revalidatePath(`/admin/clients/${enrollment.clientId}`);
  return { error: null };
}

export async function setEnrollmentInvoiceStatusAction(
  enrollmentId: string,
  status: "DRAFT" | "SENT" | "PAID"
) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };

  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) return { error: "Enrollment not found." };

  await setInvoiceStatusForEnrollment(enrollmentId, status);
  revalidatePath(`/admin/clients/${enrollment.clientId}`);
  revalidatePath("/dashboard");
  return { error: null };
}

export async function createLinkAction(_prevState: string | null, formData: FormData) {
  const session = await requireAdmin();
  if (!session) return "Unauthorized";

  const title = (formData.get("title") as string)?.trim();
  const url = (formData.get("url") as string)?.trim();
  if (!title || !url) return "Title and URL are required.";

  await prisma.helpfulLink.create({
    data: {
      title,
      url,
      description: (formData.get("description") as string)?.trim() || null,
      sortOrder: Number(formData.get("sortOrder")) || 0,
    },
  });

  revalidatePath("/admin/links");
  revalidatePath("/dashboard");
  return null;
}

export async function updateLinkAction(
  linkId: string,
  data: { title: string; url: string; description: string; sortOrder: number }
) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };

  if (!data.title.trim() || !data.url.trim()) return { error: "Title and URL are required." };

  await prisma.helpfulLink.update({
    where: { id: linkId },
    data: {
      title: data.title.trim(),
      url: data.url.trim(),
      description: data.description.trim() || null,
      sortOrder: Number.isFinite(data.sortOrder) ? data.sortOrder : 0,
    },
  });

  revalidatePath("/admin/links");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteLinkAction(linkId: string) {
  const session = await requireAdmin();
  if (!session) return { error: "Unauthorized" };

  await prisma.helpfulLink.delete({ where: { id: linkId } });

  revalidatePath("/admin/links");
  revalidatePath("/dashboard");
  return { error: null };
}
