import { BookOpen, FolderGit2, LayoutGrid, type LucideIcon } from "lucide-react";

/** Pick the look of the app. Both layouts share the same navigation below. */
export const layoutConfig = {
  /** "sidebar": collapsible side navigation. "header": top navigation bar. */
  app: "sidebar" as "sidebar" | "header",
  /** Sign-in pages: "simple" (centered), "card" (centered card) or "split" (brand panel + form). */
  auth: "split" as "simple" | "card" | "split",
};

export type NavItem = { title: string; to: string; icon: LucideIcon };
export type ExternalLink = { title: string; href: string; icon: LucideIcon };

export const mainNav: NavItem[] = [{ title: "Dashboard", to: "/dashboard", icon: LayoutGrid }];

export const footerLinks: ExternalLink[] = [
  { title: "Repository", href: "https://github.com/hammadzafar05/arzan", icon: FolderGit2 },
  { title: "Documentation", href: "https://github.com/hammadzafar05/arzan#readme", icon: BookOpen },
];
