import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { type ReactNode, useState } from "react";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { UserMenu } from "@/components/user-menu";
import { VerifyEmailBanner } from "@/components/verify-email-banner";
import type { Session } from "@/lib/auth-client";
import { FooterLinks, MainNavLinks } from "./nav-links";

function SidebarContents({ user, onNavigate }: { user: Session["user"]; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-4 p-3">
      <Link to="/dashboard" onClick={onNavigate} className="rounded-md px-1 py-1">
        <AppLogo />
      </Link>
      <div className="flex-1">
        <MainNavLinks onNavigate={onNavigate} />
      </div>
      <FooterLinks />
      <UserMenu user={user} />
    </div>
  );
}

export function AppSidebarLayout({ user, children }: { user: Session["user"]; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh bg-sidebar lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-sidebar-border border-r bg-sidebar text-sidebar-foreground lg:block">
        <SidebarContents user={user} />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-sidebar px-3 lg:hidden">
        <Button variant="ghost" size="icon" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu />
        </Button>
        <Link to="/dashboard">
          <AppLogo />
        </Link>
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarContents user={user} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1 lg:py-2 lg:pr-2">
        <main className="min-h-[calc(100dvh-3.5rem)] bg-background lg:min-h-[calc(100dvh-1rem)] lg:rounded-xl lg:border lg:shadow-xs">
          <VerifyEmailBanner user={user} />
          {children}
        </main>
      </div>
    </div>
  );
}
