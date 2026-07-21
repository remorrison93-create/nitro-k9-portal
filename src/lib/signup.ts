import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createInvoice } from "@/lib/integrations/square";
import { sendEmail } from "@/lib/integrations/email";

// First-time booking flow: creates a temporary (LEAD) account, one Dog, and an Enrollment
// against the Initial Assessment service. The account stays LEAD-tier (shop + 1 assessment
// booking + helpful links only) until the assessment is paid, which the Square webhook
// (see /api/webhooks/square) promotes to CLIENT. Shared by the /api/signup route (for the
// future mobile app) and the web signup form's server action.
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dogName: z.string().min(1),
  dogWeightLbs: z.number().int().positive(),
});

export type SignupInput = z.infer<typeof signupSchema>;

export class SignupError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export async function createLeadAssessmentSignup(input: SignupInput) {
  const { email, password, firstName, lastName, dogName, dogWeightLbs } = input;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new SignupError("An account with this email already exists.", 409);
  }

  const assessment = await prisma.service.findFirst({ where: { isAssessment: true, active: true } });
  if (!assessment) {
    throw new SignupError("Assessment service is not configured yet.", 500);
  }

  const passwordHash = await hash(password, 10);
  const weightClass = dogWeightLbs > 35 ? "OVER_35" : "UNDER_35";

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: "LEAD",
      dogs: { create: { name: dogName, weightLbs: dogWeightLbs, weightClass } },
    },
    include: { dogs: true },
  });

  const enrollment = await prisma.enrollment.create({
    data: {
      clientId: user.id,
      dogId: user.dogs[0].id,
      serviceId: assessment.id,
      lessonsTotal: assessment.lessonCount,
    },
  });

  const invoice = await createInvoice({
    clientId: user.id,
    clientEmail: user.email,
    amountCents: assessment.priceCents,
    description: "Initial Assessment",
  });

  await prisma.invoice.create({
    data: {
      clientId: user.id,
      enrollmentId: enrollment.id,
      squareInvoiceId: invoice.squareInvoiceId,
      amountDueCents: assessment.priceCents,
      status: "SENT",
    },
  });

  await sendEmail({
    to: user.email,
    subject: "Your Nitro K-9 assessment request",
    html: `<p>Hi ${firstName}, thanks for requesting an assessment for ${dogName}. Sign your contract and complete payment (${invoice.publicPaymentUrl}) to confirm your appointment.</p>`,
  });

  return { user, enrollment };
}
