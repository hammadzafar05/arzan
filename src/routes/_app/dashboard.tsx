import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layouts/app-layout";
import { Skeleton } from "@/components/ui/skeleton";
import { useTitle } from "@/hooks/use-title";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

type DashboardData = { greeting: string; memberSince: string; emailVerified: boolean };

function Placeholder({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-dashed ${className}`}>
      <svg className="absolute inset-0 size-full stroke-border" fill="none" aria-hidden>
        <defs>
          <pattern id="p" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M-3 13 15-5M-5 5l18-18M-1 21 17 3" />
          </pattern>
        </defs>
        <rect stroke="none" fill="url(#p)" width="100%" height="100%" />
      </svg>
    </div>
  );
}

function Dashboard() {
  useTitle("Dashboard");
  // Example call to a protected API route (worker/routes/dashboard.ts).
  const { data, isPending, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<DashboardData>("/dashboard"),
  });
  return (
    <>
      <PageHeader title="Dashboard" description={isPending ? "Loading…" : error ? error.message : data?.greeting} />
      <div className="grid gap-4 p-4 sm:p-6">
        {isPending ? (
          <Skeleton className="h-5 w-64" />
        ) : (
          data && (
            <p className="text-muted-foreground text-sm">
              Member since {new Date(data.memberSince).toLocaleDateString(undefined, { dateStyle: "long" })}. This text
              comes from <code className="rounded bg-muted px-1 py-0.5 text-xs">GET /api/dashboard</code>.
            </p>
          )
        )}
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          <Placeholder className="aspect-video" />
          <Placeholder className="aspect-video" />
          <Placeholder className="aspect-video" />
        </div>
        <Placeholder className="min-h-[50vh]" />
      </div>
    </>
  );
}
