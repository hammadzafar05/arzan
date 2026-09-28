import type { Env } from "../env";

export interface Email {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Emails "sent" on a local dev server without RESEND_API_KEY (dev and tests). Newest last. */
export const devOutbox: Email[] = [];

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** True when the app runs on this machine (vite dev, preview, tests). */
export function isLocalOrigin(origin: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

/** Whether users can actually receive email: a provider is configured, or it's a local dev server. */
export function emailEnabled(env: Env, origin: string): boolean {
  return Boolean(env.RESEND_API_KEY) || isLocalOrigin(origin);
}

/**
 * Sends through Resend when RESEND_API_KEY is set.
 * - Local dev without a key: prints the email (with its links) so you can click through flows.
 * - Deployed without a key: sends nothing and logs a warning WITHOUT the email body, because
 *   reset and verification links are credentials and must never land in production logs.
 */
export async function sendEmail(env: Env, email: Email, origin: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    if (isLocalOrigin(origin)) {
      devOutbox.push(email);
      if (devOutbox.length > 50) devOutbox.shift();
      console.log(`\n✉️  Email to ${email.to}: ${email.subject}\n${email.text}\n`);
    } else {
      console.warn(`Email not sent ("${email.subject}"): set the RESEND_API_KEY secret to enable email.`);
    }
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.EMAIL_FROM ?? "onboarding@resend.dev",
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });
  if (!res.ok) {
    console.error("Resend error", res.status, (await res.text()).slice(0, 500));
    throw new Error("Could not send the email. Please try again.");
  }
}
