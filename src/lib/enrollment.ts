import { prisma } from "@/lib/db";

// Shared by the admin panel's manual contract/invoice tracking (see actions.ts) and the Square
// webhook — whichever one ends up flipping these fields for a given client, the effects (in
// particular, promoting a LEAD to a full CLIENT account) need to be identical.

export async function setContractStatus(
  enrollmentId: string,
  status: "NOT_SENT" | "SENT" | "SIGNED"
) {
  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { contractStatus: status, contractSignedAt: status === "SIGNED" ? new Date() : null },
  });
}

export async function setInvoiceStatusForEnrollment(
  enrollmentId: string,
  status: "DRAFT" | "SENT" | "PAID"
) {
  const enrollment = await prisma.enrollment.findUniqueOrThrow({
    where: { id: enrollmentId },
    include: { invoice: true, service: true },
  });

  if (!enrollment.invoice) {
    throw new Error("This enrollment has no invoice yet.");
  }

  await prisma.invoice.update({
    where: { id: enrollment.invoice.id },
    data: {
      status,
      amountPaidCents: status === "PAID" ? enrollment.invoice.amountDueCents : 0,
    },
  });

  // A LEAD account means "hasn't paid for anything yet" — normally that's resolved by paying
  // for the assessment, but an admin can also assign (and mark paid) a full program directly
  // without a prior assessment. Either way, once any invoice is paid, they're not a lead
  // anymore. Regardless of whether the payment was recorded by a real Square webhook or an
  // admin manually checking "Invoice Paid".
  if (status === "PAID") {
    await prisma.user.updateMany({
      where: { id: enrollment.clientId, role: "LEAD" },
      data: { role: "CLIENT" },
    });
  }
}
