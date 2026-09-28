import { createFileRoute } from "@tanstack/react-router";
import { Monitor, Moon, Sun } from "lucide-react";
import { SectionHeading } from "@/components/form";
import { useTitle } from "@/hooks/use-title";
import { type Theme, useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings/appearance")({ component: Appearance });

const options: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

function Appearance() {
  useTitle("Appearance");
  const { theme, setTheme } = useTheme();
  return (
    <section className="space-y-6">
      <SectionHeading title="Appearance" description="Choose how the app looks on this device." />
      <fieldset className="inline-flex gap-1 rounded-lg bg-muted p-1">
        <legend className="sr-only">Theme</legend>
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-1.5 text-sm transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
              theme === o.value ? "bg-background font-medium shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <input
              type="radio"
              name="theme"
              value={o.value}
              checked={theme === o.value}
              onChange={() => setTheme(o.value)}
              className="sr-only"
            />
            <o.icon className="size-4" aria-hidden />
            {o.label}
          </label>
        ))}
      </fieldset>
    </section>
  );
}
