import type { ErrorComponentProps } from "@tanstack/react-router";
import { AlertTriangle, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTitle } from "@/hooks/use-title";
import { ServerError } from "@/lib/auth-client";

/** Shown when a page can't load: a clear setup message for unconfigured deployments, else a retry. */
export function ErrorPage({ error, reset }: ErrorComponentProps) {
  const notConfigured = error instanceof ServerError && error.status === 503;
  useTitle(notConfigured ? "Setup needed" : "Something went wrong");
  const Icon = notConfigured ? Settings2 : AlertTriangle;
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <Icon className="size-8 text-muted-foreground" aria-hidden />
      <h1 className="font-semibold text-2xl tracking-tight">
        {notConfigured ? "This deployment isn't set up yet" : "Something went wrong"}
      </h1>
      <p className="max-w-md text-balance text-muted-foreground">
        {notConfigured
          ? error.message
          : error instanceof Error && error.message
            ? error.message
            : "The page couldn't load. Check your connection and try again."}
      </p>
      {notConfigured && (
        <p className="max-w-md text-balance text-muted-foreground text-sm">
          If you run this site, see “Deploy” in the project README.
        </p>
      )}
      <Button onClick={() => (notConfigured ? window.location.reload() : reset())}>Try again</Button>
    </div>
  );
}
