import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Field, InputError, SectionHeading } from "@/components/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTitle } from "@/hooks/use-title";
import { authClient, refreshSession, sessionQuery } from "@/lib/auth-client";
import { useEmailEnabled } from "@/lib/server-info";

export const Route = createFileRoute("/_app/settings/profile")({ component: Profile });

function Profile() {
  useTitle("Profile settings");
  const qc = useQueryClient();
  const { data: session } = useQuery(sessionQuery);
  const user = session!.user;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const emailEnabled = useEmailEnabled();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    const { error } = await authClient.updateUser({ name: String(new FormData(e.currentTarget).get("name")).trim() });
    setPending(false);
    if (error) return setError(error.message);
    await refreshSession(qc);
    toast.success("Profile saved");
  }

  async function resendVerification() {
    const { error } = await authClient.sendVerificationEmail({ email: user.email, callbackURL: "/settings/profile" });
    if (error) toast.error(error.message ?? "Couldn't send the email.");
    else toast.success(`Verification link sent to ${user.email}`);
  }

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <SectionHeading title="Profile information" description="Update your name. Your email is used to sign in." />
        <form className="grid gap-5" onSubmit={onSubmit}>
          <Field id="name" label="Name" defaultValue={user.name} required autoComplete="name" maxLength={100} />
          <div className="grid gap-2">
            <Field id="email" label="Email address" type="email" value={user.email} readOnly disabled />
            {user.emailVerified ? (
              <Badge variant="secondary">
                <BadgeCheck /> Verified
              </Badge>
            ) : !emailEnabled ? (
              <p className="text-muted-foreground text-sm">Your email address is unverified.</p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Your email address is unverified.{" "}
                <button
                  type="button"
                  className="text-foreground underline underline-offset-4"
                  onClick={resendVerification}
                >
                  Resend the verification email.
                </button>
              </p>
            )}
          </div>
          <InputError message={error} />
          <div>
            <Button type="submit" loading={pending}>
              Save
            </Button>
          </div>
        </form>
      </section>
      <Separator />
      <DeleteAccount />
    </div>
  );
}

function DeleteAccount() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    const { error } = await authClient.deleteUser({
      password: String(new FormData(e.currentTarget).get("delete-password")),
    });
    setPending(false);
    if (error) return setError(error.message ?? "Couldn't delete the account.");
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "session" });
    qc.setQueryData(sessionQuery.queryKey, null);
    toast.success("Your account has been deleted");
    await navigate({ to: "/" });
  }

  return (
    <section className="space-y-6">
      <SectionHeading
        title="Delete account"
        description="Delete your account and all of its data. This can't be undone."
      />
      <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
        <div className="space-y-0.5">
          <p className="font-medium">Warning</p>
          <p className="text-sm">Please proceed with caution, this cannot be undone.</p>
        </div>
        <Dialog onOpenChange={() => setError(undefined)}>
          <DialogTrigger asChild>
            <Button variant="destructive">Delete account</Button>
          </DialogTrigger>
          <DialogContent>
            <form className="grid gap-4" onSubmit={onSubmit}>
              <DialogHeader>
                <DialogTitle>Are you sure you want to delete your account?</DialogTitle>
                <DialogDescription>
                  Once your account is deleted, all of its data is permanently removed. Enter your password to confirm.
                </DialogDescription>
              </DialogHeader>
              <Field
                id="delete-password"
                label="Password"
                type="password"
                autoComplete="current-password"
                required
                error={error}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit" variant="destructive" loading={pending}>
                  Delete account
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
