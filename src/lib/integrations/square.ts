// Square integration — payments + (client-side) contract status.
//
// Real implementation notes for later:
// - Payments/Invoices: Square Invoices API (https://developer.squareup.com/docs/invoices-api/overview)
//   using SQUARE_ACCESS_TOKEN + SQUARE_LOCATION_ID.
// - Webhooks: subscribe to `invoice.payment_made` / `invoice.updated` and verify with
//   SQUARE_WEBHOOK_SIGNATURE_KEY, then call recordInvoicePayment() below.
// - Contracts: Square has no native e-signature product. Confirm what actually generates the
//   "contract signed" event (Square's own agreement flow, or a third party like PandaDoc/DocuSign)
//   and wire its webhook into markContractSigned() the same way.
//
// Everything here is a typed placeholder: with no SQUARE_ACCESS_TOKEN set, calls log and return
// mock data instead of hitting the network, so the rest of the app can be built and demoed now.

const isConfigured = () => Boolean(process.env.SQUARE_ACCESS_TOKEN);

export interface CreateInvoiceInput {
  clientId: string;
  clientEmail: string;
  amountCents: number;
  description: string;
}

export interface SquareInvoiceResult {
  squareInvoiceId: string;
  publicPaymentUrl: string;
  status: "SENT" | "PAID";
}

export async function createInvoice(
  input: CreateInvoiceInput
): Promise<SquareInvoiceResult> {
  if (!isConfigured()) {
    console.warn("[square:placeholder] createInvoice", input);
    return {
      squareInvoiceId: `mock-invoice-${Date.now()}`,
      publicPaymentUrl: "https://squareup.com/pay/placeholder",
      status: "SENT",
    };
  }

  // TODO: real call — POST https://connect.squareup.com/v2/invoices
  throw new Error("Square live integration not implemented yet.");
}

export interface SquareWebhookEvent {
  type: string;
  invoiceId?: string;
  contractRef?: string;
  raw: unknown;
}

export function verifyWebhookSignature(
  _rawBody: string,
  _signatureHeader: string | null
): boolean {
  if (!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) {
    console.warn(
      "[square:placeholder] verifyWebhookSignature — no signature key configured, accepting unverified"
    );
    return true;
  }

  // TODO: real HMAC-SHA256 verification against SQUARE_WEBHOOK_SIGNATURE_KEY.
  return true;
}
