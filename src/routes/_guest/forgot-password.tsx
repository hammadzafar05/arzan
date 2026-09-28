import { createFileRoute, Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Field, InputError } from "@/components/form";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { useTitle } from "@/hooks/use-title";
import { authClient } from "@/lib/auth-client";
import { useEmailEnabled } from "@/lib/server-info";

export const Route = createFileRoute("/_guest/forgot-password")({ component: ForgotPassword });

function ForgotPassword() {
  useTitle("Forgot password");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const emailEnabled = useEmailEnabled();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    const { error } = await authClient.requestPasswordReset({
      email: String(new FormData(e.currentTarget).get("email")),
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);
    if (error)
      setError(error.status === 429 ? "Too many requests. Please wait a minute and try again." : error.message);
    else setSent(true);
  }

  return (
    <AuthLayout title="Forgot your password?" description="Enter your email and we'll send you a link to reset it">
      {!emailEnabled && (
        <p
          role="alert"
          className="rounded-md bg-amber-50 px-3 py-2 text-amber-900 text-sm dark:bg-amber-950/40 dark:text-amber-200"
        >
          Password reset emails aren't set up on this site yet, so no email will arrive. Please contact the site owner.
        </p>
      )}
      {sent ? (
        <p className="rounded-md bg-green-50 px-3 py-2 text-center text-green-800 text-sm dark:bg-green-950/40 dark:text-green-300">
          If an account exists for that email, a reset link is on its way. Check your inbox.
        </p>
      ) : (
        <form className="grid gap-5" onSubmit={onSubmit}>
          <Field
            id="email"
            label="Email address"
            type="email"
            autoComplete="email"
            required
            autoFocus
            placeholder="you@example.com"
          />
          <InputError message={error} />
          <Button type="submit" className="w-full" loading={pending}>
            Email password reset link
          </Button>
        </form>
      )}
      <p className="text-center text-muted-foreground text-sm">
        Or, return to{" "}
        <Link to="/login" className="text-foreground underline underline-offset-4">
          log in
        </Link>
      </p>
    </AuthLayout>
  );
}
