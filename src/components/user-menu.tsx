import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient, type Session } from "@/lib/auth-client";
import { cn, initials } from "@/lib/utils";

export function UserAvatar({ user, className }: { user: Session["user"]; className?: string }) {
  return (
    <Avatar className={cn("size-8 rounded-lg", className)}>
      {user.image && <AvatarImage src={user.image} alt="" />}
      <AvatarFallback className="rounded-lg bg-muted">{initials(user.name)}</AvatarFallback>
    </Avatar>
  );
}

export function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await authClient.signOut();
    // Drop everything cached for this user, but keep the session query observed (set to null).
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "session" });
    qc.setQueryData(["session"], null);
    await navigate({ to: "/" });
  };
}

/** Avatar button with Settings and Log out. `compact` shows only the avatar (top bar). */
export function UserMenu({ user, compact = false }: { user: Session["user"]; compact?: boolean }) {
  const signOut = useSignOut();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2 rounded-md text-left text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
          compact ? "p-1" : "w-full p-2 hover:bg-sidebar-accent",
        )}
        aria-label="Open user menu"
      >
        <UserAvatar user={user} />
        {!compact && (
          <>
            <span className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-muted-foreground text-xs">{user.email}</span>
            </span>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" side={compact ? "bottom" : "top"}>
        <DropdownMenuLabel className="flex items-center gap-2 font-normal">
          <UserAvatar user={user} />
          <span className="grid min-w-0 leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="truncate text-muted-foreground text-xs">{user.email}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings/profile">
            <Settings /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
