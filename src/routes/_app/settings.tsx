import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PageHeader } from "@/components/layouts/app-layout";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings")({ component: SettingsLayout });

const items = [
  { title: "Profile", to: "/settings/profile" },
  { title: "Password", to: "/settings/password" },
  { title: "Sessions", to: "/settings/sessions" },
  { title: "Appearance", to: "/settings/appearance" },
] as const;

function SettingsLayout() {
  return (
    <>
      <PageHeader title="Settings" description="Manage your profile and account settings" />
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:flex-row lg:gap-12">
        <nav aria-label="Settings" className="-mx-1 flex gap-1 overflow-x-auto lg:mx-0 lg:w-48 lg:flex-col">
          {items.map((i) => (
            <Link
              key={i.to}
              to={i.to}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-2 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50",
              )}
              activeProps={{ className: "bg-accent font-medium" }}
            >
              {i.title}
            </Link>
          ))}
        </nav>
        <div className="min-w-0 max-w-xl flex-1">
          <Outlet />
        </div>
      </div>
    </>
  );
}
