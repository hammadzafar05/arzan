import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Field, InputError, SectionHeading } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTitle } from "@/hooks/use-title";
import { authClient } from "@/lib/auth-client";
import { appConfig } from "../../../../shared/config";

export const Route = createFileRoute("/_app/settings/password")({ component: Password });

function Password() {
  useTitle("Password settings");
  const [errors, setErrors] = useState<{ current?: string; confirm?: string; form?: string }>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const newPassword = String(form.get("password"));
    if (newPassword !== form.get("password_confirmation")) return setErrors({ confirm: "The passwords don't match." });
    setPending(true);
    setErrors({});
    const { error } = await authClient.changePassword({
      currentPassword: String(form.get("current_password")),
      newPassword,
      revokeOtherSessions: form.get("revoke") === "on",
    });
    setPending(false);
    if (error) {
      return setErrors(
        error.code === "INVALID_PASSWORD" ? { current: "That's not your current password." } : { form: error.message },
      );
    }
    formEl.reset();
    toast.success("Password updated");
  }

  return (
    <section className="space-y-6">
      <SectionHeading title="Update password" description="Use a long, random password to keep your account secure." />
      <form className="grid gap-5" onSubmit={onSubmit}>
        <Field
          id="current_password"
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          error={errors.current}
        />
        <Field
          id="password"
          label="New password"
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
        <div className="flex items-center gap-2">
          <Checkbox id="revoke" name="revoke" defaultChecked />
          <Label htmlFor="revoke" className="font-normal">
            Sign out of all other devices
          </Label>
        </div>
        <InputError message={errors.form} />
        <div>
          <Button type="submit" loading={pending}>
            Save password
          </Button>
        </div>
      </form>
    </section>
  );
}
