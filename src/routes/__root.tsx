import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import { ErrorPage } from "@/components/error-page";
import { Button } from "@/components/ui/button";
import { useTitle } from "@/hooks/use-title";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Outlet,
  errorComponent: ErrorPage,
  notFoundComponent: NotFound,
});

function NotFound() {
  useTitle("Page not found");
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="font-semibold text-muted-foreground text-sm">404</p>
      <h1 className="font-semibold text-2xl tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">The page you're looking for doesn't exist or was moved.</p>
      <Button asChild>
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}
