import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/layouts/app-layout";
import { sessionQuery } from "@/lib/auth-client";

/** Every page inside requires a signed-in user. */
export const Route = createFileRoute("/_app")({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQuery);
    if (!session) throw redirect({ to: "/login", search: { redirect: location.href } });
    return { session };
  },
  component: AppRoute,
});

function AppRoute() {
  const initial = Route.useRouteContext().session;
  const { data } = useQuery(sessionQuery);
  const user = (data ?? initial).user;
  return (
    <AppLayout user={user}>
      <Outlet />
    </AppLayout>
  );
}
