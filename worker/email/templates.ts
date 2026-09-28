import { appConfig } from "../../shared/config";
import type { Email } from ".";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, intro: string, action: { label: string; url: string }, outro: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#18181b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:12px;padding:32px">
<tr><td>
<p style="margin:0 0 24px;font-weight:700;font-size:16px">${escapeHtml(appConfig.name)}</p>
<h1 style="margin:0 0 12px;font-size:20px">${escapeHtml(title)}</h1>
<p style="margin:0 0 24px;line-height:1.6;color:#3f3f46">${escapeHtml(intro)}</p>
<a href="${escapeHtml(action.url)}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">${escapeHtml(action.label)}</a>
<p style="margin:24px 0 0;line-height:1.6;color:#71717a;font-size:13px">${escapeHtml(outro)}</p>
<p style="margin:16px 0 0;color:#a1a1aa;font-size:12px;word-break:break-all">${escapeHtml(action.url)}</p>
</td></tr></table></td></tr></table></body></html>`;
}

export function verifyEmail(to: string, url: string): Email {
  const intro = "Please confirm your email address to finish setting up your account.";
  const outro = "If you didn't create an account, you can ignore this email.";
  return {
    to,
    subject: `Verify your email for ${appConfig.name}`,
    html: layout("Verify your email", intro, { label: "Verify email", url }, outro),
    text: `${intro}\n\nVerify email: ${url}\n\n${outro}`,
  };
}

export function resetPassword(to: string, url: string): Email {
  const intro = "We received a request to reset your password. This link expires in 1 hour.";
  const outro = "If you didn't ask to reset your password, you can ignore this email.";
  return {
    to,
    subject: `Reset your ${appConfig.name} password`,
    html: layout("Reset your password", intro, { label: "Reset password", url }, outro),
    text: `${intro}\n\nReset password: ${url}\n\n${outro}`,
  };
}
