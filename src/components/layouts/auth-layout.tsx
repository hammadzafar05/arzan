import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppLogo, AppLogoIcon } from "@/components/app-logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { layoutConfig } from "@/config";
import { appConfig } from "../../../shared/config";

type Props = { title: string; description: string; children: ReactNode };

function Heading({ title, description }: Omit<Props, "children">) {
  return (
    <div className="space-y-2 text-center">
      <h1 className="font-semibold text-xl tracking-tight">{title}</h1>
      <p className="text-balance text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

function Simple({ title, description, children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="grid w-full max-w-sm gap-6">
        <Link to="/" className="mx-auto" aria-label="Home">
          <AppLogoIcon className="size-10" />
        </Link>
        <Heading title={title} description={description} />
        {children}
      </div>
    </div>
  );
}

function CardLayout({ title, description, children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="grid w-full max-w-md gap-6">
        <Link to="/" className="mx-auto" aria-label="Home">
          <AppLogo />
        </Link>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}

function Split({ title, description, children }: Props) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-zinc-900 p-10 text-white lg:flex">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <AppLogoIcon />
          {appConfig.name}
        </Link>
        <blockquote className="max-w-md space-y-2">
          <p className="text-lg leading-relaxed">
            “Ship the boring parts in an afternoon, host them for free, and spend your time on the product.”
          </p>
          <footer className="text-sm text-zinc-400">Built on Cloudflare Workers, D1 and Better Auth</footer>
        </blockquote>
      </div>
      <div className="flex flex-col items-center justify-center gap-6 p-6 md:p-10">
        <Link to="/" className="lg:hidden" aria-label="Home">
          <AppLogo />
        </Link>
        <div className="grid w-full max-w-sm gap-6">
          <Heading title={title} description={description} />
          {children}
        </div>
      </div>
    </div>
  );
}

/** Wraps login, register and password pages. Pick the variant in src/config.ts. */
export function AuthLayout(props: Props) {
  if (layoutConfig.auth === "card") return <CardLayout {...props} />;
  if (layoutConfig.auth === "simple") return <Simple {...props} />;
  return <Split {...props} />;
}
