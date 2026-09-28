import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { appConfig } from "../../shared/config";

export function AppLogoIcon({ className }: { className?: string }) {
  return (
    <span className={cn("flex size-8 items-center justify-center rounded-md bg-brand text-white", className)}>
      <Flame className="size-5" aria-hidden />
    </span>
  );
}

export function AppLogo() {
  return (
    <span className="flex items-center gap-2">
      <AppLogoIcon />
      <span className="truncate font-semibold">{appConfig.name}</span>
    </span>
  );
}
