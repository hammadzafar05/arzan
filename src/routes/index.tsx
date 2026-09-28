import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Database, KeyRound, LayoutDashboard, Rocket, ShieldCheck, TestTube2 } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";
import { useTitle } from "@/hooks/use-title";
import { sessionQuery } from "@/lib/auth-client";
import { appConfig } from "../../shared/config";

export const Route = createFileRoute("/")({ component: Welcome });

const features = [
  {
    icon: KeyRound,
    title: "Authentication",
    text: "Sign-up, login, email verification, password reset and sessions, powered by Better Auth.",
  },
  {
    icon: Database,
    title: "D1 + Drizzle",
    text: "Typed schema, generated migrations, applied automatically on deploy.",
  },
  {
    icon: LayoutDashboard,
    title: "shadcn/ui",
    text: "Sidebar and header layouts, settings pages, light and dark mode.",
  },
  {
    icon: ShieldCheck,
    title: "Free-tier safe",
    text: "Static assets are free; password hashing fits the 10 ms CPU limit.",
  },
  { icon: TestTube2, title: "Tested", text: "API tests against a real local D1, plus Playwright end-to-end tests." },
  {
    icon: Rocket,
    title: "One deploy",
    text: "One Worker serves the app and the API. Run npm run deploy and you're live.",
  },
];

function Welcome() {
  useTitle();
  const { data: session } = useQuery(sessionQuery);
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <AppLogo />
        <nav className="flex items-center gap-2">
          {session ? (
            <Button asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 pt-12 pb-20 sm:px-6 sm:pt-20">
        <div className="max-w-2xl space-y-6">
          <p className="font-medium text-brand text-sm">Built with Flarekit</p>
          <h1 className="text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
            {appConfig.name} is up and running.
          </h1>
          <p className="text-balance text-lg text-muted-foreground">
            Accounts, settings and layouts are ready. Edit{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-base">src/routes/index.tsx</code> to make this page
            yours, and build your app in{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-base">src/routes/_app</code>.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to={session ? "/dashboard" : "/register"}>{session ? "Open dashboard" : "Create an account"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="https://github.com/hammadzafar05/flarekit#readme" target="_blank" rel="noreferrer">
                Read the docs
              </a>
            </Button>
          </div>
        </div>
        <h2 className="mt-16 font-medium text-muted-foreground text-sm">What's included</h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <li key={f.title} className="rounded-xl border p-5">
              <f.icon className="size-5 text-brand" aria-hidden />
              <h2 className="mt-3 font-medium">{f.title}</h2>
              <p className="mt-1 text-muted-foreground text-sm">{f.text}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
