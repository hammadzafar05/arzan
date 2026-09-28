import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Field, InputError } from "@/components/form";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTitle } from "@/hooks/use-title";
import { authClient, refreshSession } from "@/lib/auth-client";
import { safeRedirect } from "@/lib/utils";

export const Route = createFileRoute("/_guest/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string; reset?: boolean } => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    reset: s.reset === true || s.reset === "1" ? true : undefined,
  }),
  component: Login,
});

function Login() {
  useTitle("Log in");
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [error, setError] = useState<string>();
  const [unverified, setUnverified] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    setPending(true);
    setError(undefined);
    setUnverified(undefined);
    const { error } = await authClient.signIn.email({
      email,
      password: String(form.get("password")),
      rememberMe: form.get("remember") === "on",
    });
    if (error) {
      setPending(false);
      if (error.code === "EMAIL_NOT_VERIFIED") setUnverified(email);
      setError(error.status === 429 ? "Too many attempts. Please wait a minute and try again." : error.message);
      return;
    }
    await refreshSession(qc);
    await navigate({ to: safeRedirect(search.redirect) });
  }

  async function resend() {
    if (!unverified) return;
    const { error } = await authClient.sendVerificationEmail({ email: unverified, callbackURL: "/dashboard" });
    if (error) toast.error(error.message ?? "Couldn't send the email.");
    else toast.success("Verification link sent. Check your inbox.");
  }

  return (
    <AuthLayout title="Log in to your account" description="Enter your email and password below to log in">
      {search.reset && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-center text-green-800 text-sm dark:bg-green-950/40 dark:text-green-300">
          Your password has been reset. Log in with your new password.
        </p>
      )}
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
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          aside={
            <Link to="/forgot-password" className="text-muted-foreground text-sm underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          }
        />
        <div className="flex items-center gap-2">
          <Checkbox id="remember" name="remember" defaultChecked />
          <Label htmlFor="remember" className="font-normal">
            Remember me
          </Label>
        </div>
        <InputError message={error} />
        {unverified && (
          <Button type="button" variant="outline" onClick={resend}>
            Resend verification email
          </Button>
        )}
        <Button type="submit" className="w-full" loading={pending}>
          Log in
        </Button>
      </form>
      <p className="text-center text-muted-foreground text-sm">
        Don't have an account?{" "}
        <Link to="/register" className="text-foreground underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
