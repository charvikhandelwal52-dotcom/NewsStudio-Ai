import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  PenSquare,
  Rss,
  Send,
  Settings as SettingsIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inbox", label: "News Inbox", icon: Inbox },
  { to: "/studio", label: "Content Studio", icon: PenSquare },
  { to: "/approvals", label: "Approval Center", icon: CheckCircle2 },
  { to: "/calendar", label: "Content Calendar", icon: CalendarDays },
  { to: "/published", label: "Published", icon: Send },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/sources", label: "Sources", icon: Rss },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          activeProps={{ className: "bg-primary/10 text-primary" }}
          inactiveProps={{ className: "text-muted-foreground hover:bg-muted hover:text-foreground" }}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
        >
          <item.icon className="size-4 shrink-0" aria-hidden />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-3 py-1">
      <span className="rounded-md bg-primary/10 p-2 text-primary">
        <Newspaper className="size-4" aria-hidden />
      </span>
      <span className="font-headline text-lg text-foreground">NewsPilot AI</span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const title = useRouterState({
    select: (state) =>
      NAV.find((item) => state.location.pathname.startsWith(item.to))?.label ?? "NewsPilot AI",
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials = (user?.displayName ?? "NP")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-6 border-r border-border bg-card px-3 py-5 lg:flex">
        <Brand />
        <NavList />
        <p className="mt-auto px-3 text-xs leading-relaxed text-muted-foreground">
          Human approval is required before anything can be scheduled or published.
        </p>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                <Menu className="size-5" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 px-3 py-5">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="space-y-6">
                <Brand />
                <NavList onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <h2 className="font-headline text-base text-foreground">{title}</h2>

          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <span className="hidden rounded-full border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground capitalize sm:inline">
                {user.role}
              </span>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2" aria-label="Account menu">
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary",
                    )}
                  >
                    {initials}
                  </span>
                  <span className="hidden max-w-[140px] truncate sm:inline">
                    {user?.displayName ?? "Account"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {user?.email ?? "Signed in"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void handleSignOut()}>
                  <LogOut className="mr-2 size-4" aria-hidden />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
