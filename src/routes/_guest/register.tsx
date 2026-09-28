import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Field, InputError } from "@/components/form";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { useTitle } from "@/hooks/use-title";
import { authClient, refreshSession } from "@/lib/auth-client";
import { appConfig } from "../../../shared/config";

export const Route = createFileRoute("/_guest/register")({ component: Register });

function Register() {
  useTitle("Register");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [errors, setErrors] = useState<{ confirm?: string; form?: string }>({});
  const [pending, setPending] = useState(false);
  const [checkInbox, setCheckInbox] = useState<string>();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password !== form.get("password_confirmation")) {
      setErrors({ confirm: "The passwords don't match." });
      return;
    }
    const email = String(form.get("email"));
    setPending(true);
    setErrors({});
    const { error } = await authClient.signUp.email({
      name: String(form.get("name")),
      email,
      password,
      callbackURL: "/dashboard",
    });
    setPending(false);
    if (error) {
      setErrors({
        form: error.status === 429 ? "Too many attempts. Please wait a minute and try again." : error.message,
      });
      return;
    }
    if (appConfig.requireEmailVerification) {
      setCheckInbox(email);
      return;
    }
    await refreshSession(qc);
    await navigate({ to: "/dashboard" });
  }

  if (checkInbox) {
    return (
      <AuthLayout title="Check your inbox" description={`We sent a verification link to ${checkInbox}.`}>
        <p className="text-center text-muted-foreground text-sm">
          Click the link in the email to activate your account, then{" "}
          <Link to="/login" className="text-foreground underline underline-offset-4">
            log in
          </Link>
          .
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create an account" description="Enter your details below to create your account">
      <form className="grid gap-5" onSubmit={onSubmit}>
        <Field id="name" label="Name" autoComplete="name" required autoFocus placeholder="Full name" maxLength={100} />
        <Field
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
        />
        <Field
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={appConfig.minPasswordLength}
          hint={`At least ${appConfig.minPasswordLength} characters.`}
        />
        <Field
          id="password_confirmation"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirm}
        />
        <InputError message={errors.form} />
        <Button type="submit" className="w-full" loading={pending}>
          Create account
        </Button>
      </form>
      <p className="text-center text-muted-foreground text-sm">
        Already have an account?{" "}
        <Link to="/login" className="text-foreground underline underline-offset-4">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
