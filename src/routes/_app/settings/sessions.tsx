import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { SectionHeading } from "@/components/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTitle } from "@/hooks/use-title";
import { authClient, sessionQuery } from "@/lib/auth-client";

export const Route = createFileRoute("/_app/settings/sessions")({ component: Sessions });

/** "Chrome on macOS" from a user-agent string; good enough for a sessions list. */
export function describeAgent(ua: string | null | undefined): { label: string; mobile: boolean } {
  if (!ua) return { label: "Unknown device", mobile: false };
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  const os = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad/.test(ua)
      ? "iOS"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "an unknown OS";
  return { label: `${browser} on ${os}`, mobile: /Mobile|Android|iPhone/.test(ua) };
}

function Sessions() {
  useTitle("Sessions");
  const qc = useQueryClient();
  const { data: current } = useQuery(sessionQuery);
  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await authClient.listSessions();
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const revoke = useMutation({
    mutationFn: async (token: string) => {
      const { error } = await authClient.revokeSession({ token });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Signed out of that device");
      void qc.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (e) => toast.error(e.message),
  });
  const revokeOthers = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.revokeOtherSessions();
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Signed out of all other devices");
      void qc.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const list = [...(sessions.data ?? [])].sort(
    (a, b) => Number(b.token === current?.session.token) - Number(a.token === current?.session.token),
  );

  return (
    <section className="space-y-6">
      <SectionHeading
        title="Browser sessions"
        description="Devices where you're signed in. Sign out of any you don't recognise."
      />
      {sessions.isPending ? (
        <div className="grid gap-3">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : sessions.error ? (
        <p className="text-destructive text-sm">{sessions.error.message}</p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {list.map((s) => {
            const agent = describeAgent(s.userAgent);
            const isCurrent = s.token === current?.session.token;
            const Icon = agent.mobile ? Smartphone : Monitor;
            return (
              <li key={s.id} className="flex items-center gap-3 p-3">
                <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{agent.label}</p>
                  <p className="truncate text-muted-foreground text-xs">
                    {s.ipAddress || "Unknown IP"} ·{" "}
                    {isCurrent ? "active now" : `last active ${new Date(s.updatedAt).toLocaleString()}`}
                  </p>
                </div>
                {isCurrent ? (
                  <Badge variant="secondary">This device</Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={revoke.isPending && revoke.variables === s.token}
                    onClick={() => revoke.mutate(s.token)}
                  >
                    Sign out
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {list.length > 1 && (
        <Button variant="outline" loading={revokeOthers.isPending} onClick={() => revokeOthers.mutate()}>
          Sign out of all other devices
        </Button>
      )}
    </section>
  );
}
