import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import type { ReactNode } from "react";

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

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
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

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-foreground px-5 py-7 lg:sticky lg:flex lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto">
        <span className="text-lg font-extrabold tracking-tight text-background">
          Panel
        </span>
        <span className="mt-1 text-xs font-medium uppercase tracking-widest text-background/50">
          {roleLabel}
        </span>

        <nav className="mt-9 flex flex-1 flex-col gap-1">
          {nav.map((item) =>
            item.to ? (
              <Link
                key={item.label}
                to={item.to}
                activeOptions={{ exact: item.exact ?? false }}
                className={`${navBase} ${navIdle}`}
                activeProps={{ className: `${navBase} ${navActive}` }}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                className={`${navBase} ${item.active ? navActive : navIdle}`}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </button>
            ),
          )}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-card px-6 py-5">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/12 text-sm font-bold text-primary">
              {initials}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Abmelden
            </button>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">
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
