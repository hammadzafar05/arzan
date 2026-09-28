import type { ReactNode } from "react";
import { layoutConfig } from "@/config";
import type { Session } from "@/lib/auth-client";
import { AppHeaderLayout } from "./app-header-layout";
import { AppSidebarLayout } from "./app-sidebar-layout";

export function AppLayout(props: { user: Session["user"]; children: ReactNode }) {
  return layoutConfig.app === "header" ? <AppHeaderLayout {...props} /> : <AppSidebarLayout {...props} />;
}

/** Page title bar used at the top of every signed-in page. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b px-4 py-5 sm:px-6">
      <div className="min-w-0 space-y-1">
        <h1 className="font-semibold text-xl tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
