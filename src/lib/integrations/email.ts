// Transactional email — assessment confirmations, invoice/contract notices, message-center pings.
//
// Real implementation notes for later: either send-as via Microsoft Graph
// (POST /users/{MS_GRAPH_CALENDAR_USER}/sendMail, reusing the Outlook app registration) or a
// dedicated provider like Postmark/Resend (EMAIL_PROVIDER_API_KEY). Pick one and swap the body
// of sendEmail() below — call sites don't need to change.

const isConfigured = () => Boolean(process.env.EMAIL_PROVIDER_API_KEY);

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  if (!isConfigured()) {
    console.warn("[email:placeholder] sendEmail", input);
    return;
  }

  // TODO: real call to the chosen email provider.
  throw new Error("Email live integration not implemented yet.");
}
