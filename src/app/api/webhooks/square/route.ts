import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/integrations/square";

// Placeholder Square webhook handler. Real payload shapes (invoice.updated,
// invoice.payment_made, and whatever event carries contract-signed status — see the note in
// lib/integrations/square.ts) need to be mapped once that's confirmed. For now this accepts a
// simplified shape so the rest of the app (gating on contractStatus/invoice.status) can be
// exercised end-to-end with mock data:
//   { type: "invoice.paid" | "contract.signed", enrollmentId: string }
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as { type: string; enrollmentId: string };

  if (event.type === "contract.signed") {
    await prisma.enrollment.update({
      where: { id: event.enrollmentId },
      data: { contractStatus: "SIGNED", contractSignedAt: new Date() },
    });
  }

  if (event.type === "invoice.paid") {
    await prisma.invoice.updateMany({
      where: { enrollmentId: event.enrollmentId },
      data: { status: "PAID" },
    });
    // Assessment payment is also what promotes a LEAD account to a full CLIENT account.
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: event.enrollmentId },
      include: { service: true },
    });
    if (enrollment?.service.isAssessment) {
      await prisma.user.update({
        where: { id: enrollment.clientId },
        data: { role: "CLIENT" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
