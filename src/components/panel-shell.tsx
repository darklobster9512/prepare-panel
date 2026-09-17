import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { LogOut, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

export type NavItem = {
  label: string;
  icon: LucideIcon;
  to?: string;
  exact?: boolean;
  active?: boolean;
};

const navBase =
  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors";
const navIdle = "text-background/70 hover:bg-background/10 hover:text-background";
const navActive = "bg-primary text-primary-foreground";

type PanelShellProps = {
  title: string;
  subtitle: string;
  roleLabel: string;
  userName: string;
  nav: NavItem[];
  children: ReactNode;
};

export function PanelShell({
  title,
  subtitle,
  roleLabel,
  userName,
  nav,
  children,
}: PanelShellProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setMobileNavOpen(false);
    navigate({ to: "/auth", replace: true });
  };

  const initials =
    userName
      .split(" ")
      .map((part) => part.charAt(0))
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "–";

  const navigation = (mobile = false) => (
    <>
      <nav className="mt-9 flex flex-1 flex-col gap-1">
        {nav.map((item) =>
          item.to ? (
            <Link
              key={item.label}
              to={item.to}
              activeOptions={{ exact: item.exact ?? false }}
              onClick={() => mobile && setMobileNavOpen(false)}
              className={`${navBase} ${navIdle}`}
              activeProps={{ className: `${navBase} ${navActive}` }}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Link>
          ) : (
            <Button
              key={item.label}
              type="button"
              variant="ghost"
              className={`${navBase} h-auto justify-start ${item.active ? navActive : navIdle}`}
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </Button>
          ),
        )}
      </nav>

      <div className="mt-8 border-t border-background/15 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-background">{userName}</p>
            <p className="text-xs text-background/55">{roleLabel}</p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={handleSignOut}
          className="mt-4 h-10 w-full justify-start gap-3 rounded-xl px-3.5 text-background/70 hover:bg-background/10 hover:text-background"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Abmelden
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-foreground px-5 py-7 lg:sticky lg:flex lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto">
        <span className="text-lg font-extrabold tracking-tight text-background">
          Panel
        </span>
        <span className="mt-1 text-xs font-medium uppercase tracking-widest text-background/50">
          {roleLabel}
        </span>
        {navigation()}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-4 sm:px-6 sm:py-5">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 lg:hidden"
                aria-label="Navigation öffnen"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-[min(20rem,88vw)] flex-col border-border bg-foreground px-5 py-7 [&>button]:text-background"
            >
              <SheetHeader className="text-left">
                <SheetTitle className="text-lg font-extrabold text-background">Panel</SheetTitle>
                <SheetDescription className="text-xs font-medium uppercase tracking-widest text-background/50">
                  {roleLabel}
                </SheetDescription>
              </SheetHeader>
              {navigation(true)}
            </SheetContent>
          </Sheet>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
