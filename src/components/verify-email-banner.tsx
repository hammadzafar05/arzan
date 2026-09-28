import { MailWarning } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient, type Session } from "@/lib/auth-client";
import { useEmailEnabled } from "@/lib/server-info";

export function VerifyEmailBanner({ user }: { user: Session["user"] }) {
  const [sending, setSending] = useState(false);
  const emailEnabled = useEmailEnabled();
  // Without an email provider the link can't arrive, so don't nag about it.
  if (user.emailVerified || !emailEnabled) return null;
  const resend = async () => {
    setSending(true);
    const { error } = await authClient.sendVerificationEmail({ email: user.email, callbackURL: "/dashboard" });
    setSending(false);
    if (error) toast.error(error.message ?? "Couldn't send the email.");
    else toast.success(`Verification link sent to ${user.email}`);
  };
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-amber-50 px-4 py-2 text-amber-900 text-sm dark:bg-amber-950/40 dark:text-amber-200">
      <MailWarning className="size-4 shrink-0" aria-hidden />
      <span>Please verify your email address. Check your inbox for the link.</span>
      <Button variant="link" size="sm" className="h-auto p-0 text-current underline" loading={sending} onClick={resend}>
        Resend link
      </Button>
    </div>
  );
}
