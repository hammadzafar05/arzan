import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { sessionQuery } from "@/lib/auth-client";

/** Pages for signed-out visitors. Signed-in users are sent to the dashboard. */
export const Route = createFileRoute("/_guest")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery);
    if (session) throw redirect({ to: "/dashboard" });
  },
  component: Outlet,
});
