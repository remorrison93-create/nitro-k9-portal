import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/integrations/square";
import { setContractStatus, setInvoiceStatusForEnrollment } from "@/lib/enrollment";

// Placeholder Square webhook handler. Real payload shapes (invoice.updated,
// invoice.payment_made, and whatever event carries contract-signed status — see the note in
// lib/integrations/square.ts) need to be mapped once that's confirmed. For now this accepts a
// simplified shape so the rest of the app (gating on contractStatus/invoice.status) can be
// exercised end-to-end with mock data:
//   { type: "invoice.paid" | "contract.signed", enrollmentId: string }
//
// Until Square is actually wired up, the admin panel's manual contract/invoice checkboxes
// (see actions.ts) drive these same fields directly — see lib/enrollment.ts for the shared
// logic so the two paths can't drift.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as { type: string; enrollmentId: string };

  if (event.type === "contract.signed") {
    await setContractStatus(event.enrollmentId, "SIGNED");
  }

  if (event.type === "invoice.paid") {
    await setInvoiceStatusForEnrollment(event.enrollmentId, "PAID");
  }

  return NextResponse.json({ received: true });
}
