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

export function AppHeaderLayout({ user, children }: { user: Session["user"]; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </Button>
          <Link to="/dashboard">
            <AppLogo />
          </Link>
          <div className="hidden flex-1 lg:block">
            <MainNavLinks horizontal />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden lg:block">
              <FooterLinks horizontal />
            </div>
            <UserMenu user={user} compact />
          </div>
        </div>
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-3">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="mt-8 grid gap-4">
            <MainNavLinks onNavigate={() => setOpen(false)} />
            <FooterLinks />
          </div>
        </SheetContent>
      </Sheet>
      <VerifyEmailBanner user={user} />
      <main className="mx-auto max-w-7xl">{children}</main>
    </div>
  );
}
