/**
 * Email delivery for alerts.
 *
 * FLAG: this repo has no mail provider wired (no Resend/Postmark/Nodemailer/SendGrid).
 * We deliberately do NOT add a new dependency. Delivery records a skip reason so the
 * in-app feed still works; Tom must choose a provider + SPF/DKIM before real email.
 */

export type EmailDeliveryResult =
  | { sent: true }
  | { sent: false; reason: "NO_MAIL_PROVIDER" | "NO_RECIPIENT" | "DIGEST_OFF" };

export function isMailProviderConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() ||
      process.env.POSTMARK_SERVER_TOKEN?.trim() ||
      process.env.SENDGRID_API_KEY?.trim()
  );
}

export async function sendAlertEmail(_input: {
  to: string;
  subject: string;
  textBody: string;
  unsubscribeUrl: string;
}): Promise<EmailDeliveryResult> {
  if (!isMailProviderConfigured()) {
    console.warn(
      "[alerts/email] No mail provider configured — skipping send (Phase 12 flag)"
    );
    return { sent: false, reason: "NO_MAIL_PROVIDER" };
  }
  // Unreachable until a provider is chosen and implemented without guessing.
  return { sent: false, reason: "NO_MAIL_PROVIDER" };
}

export function buildUnsubscribeUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const origin = base.replace(/\/$/, "") || "https://xoopa.app";
  return `${origin}/api/alerts/unsubscribe?token=${encodeURIComponent(token)}`;
}
