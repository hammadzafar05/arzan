import { Link } from "@tanstack/react-router";
import { footerLinks, mainNav } from "@/config";
import { cn } from "@/lib/utils";

const item =
  "flex h-9 items-center gap-2 rounded-md px-2 text-sm outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 [&_svg]:size-4 [&_svg]:shrink-0";

export function MainNavLinks({ onNavigate, horizontal = false }: { onNavigate?: () => void; horizontal?: boolean }) {
  return (
    <nav aria-label="Main" className={cn(horizontal ? "flex items-center gap-1" : "grid gap-1")}>
      {mainNav.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          onClick={onNavigate}
          className={item}
          activeProps={{ className: "bg-sidebar-accent font-medium" }}
        >
          <n.icon aria-hidden />
          {n.title}
        </Link>
      ))}
    </nav>
  );
}

export function FooterLinks({ horizontal = false }: { horizontal?: boolean }) {
  return (
    <div className={cn(horizontal ? "flex items-center gap-1" : "grid gap-1")}>
      {footerLinks.map((l) => (
        <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className={cn(item, "text-muted-foreground")}>
          <l.icon aria-hidden />
          {l.title}
        </a>
      ))}
    </div>
  );
}
