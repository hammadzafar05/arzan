import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Field, InputError } from "@/components/form";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { useTitle } from "@/hooks/use-title";
import { authClient } from "@/lib/auth-client";
import { appConfig } from "../../../shared/config";

export const Route = createFileRoute("/_guest/reset-password")({
  validateSearch: (s: Record<string, unknown>): { token?: string; error?: string } => ({
    token: typeof s.token === "string" ? s.token : undefined,
    error: typeof s.error === "string" ? s.error : undefined,
  }),
  component: ResetPassword,
});

function ResetPassword() {
  useTitle("Reset password");
  const { token, error: linkError } = Route.useSearch();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<{ confirm?: string; form?: string }>({});
  const [pending, setPending] = useState(false);

  if (!token || linkError) {
    return (
      <AuthLayout title="This link has expired" description="Password reset links work once and expire after an hour.">
        <Button asChild className="w-full">
          <Link to="/forgot-password">Request a new link</Link>
        </Button>
      </AuthLayout>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("password"));
    if (newPassword !== form.get("password_confirmation")) return setErrors({ confirm: "The passwords don't match." });
    setPending(true);
    setErrors({});
    const { error } = await authClient.resetPassword({ newPassword, token });
    setPending(false);
    if (error) return setErrors({ form: error.message });
    await navigate({ to: "/login", search: { reset: true } });
  }

  return (
    <AuthLayout title="Reset your password" description="Choose a new password for your account">
      <form className="grid gap-5" onSubmit={onSubmit}>
        <Field
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          autoFocus
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
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
