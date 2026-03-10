import { Resend } from "resend";

// Lazily instantiate so a missing key doesn't crash the server on startup
let _resend: Resend | null = null;
function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping email to ${to}: "${subject}"`);
    return;
  }
  await resend.emails.send({
    from: process.env.EMAIL_FROM || "noreply@wecare4you.ng",
    to,
    subject,
    html,
  });
}
