import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { LogoMark } from "@/components/reloop/logo";
import { useReloop } from "@/lib/reloop/store";
import { cn } from "@/lib/utils";
import type { DemoRole } from "@/lib/reloop/types";

const NAV: { group: string; items: { to: string; label: string }[] }[] = [
  {
    group: "Operations",
    items: [
      { to: "/", label: "Overview" },
      { to: "/intake", label: "Intake" },
      { to: "/batches", label: "Batches" },
      { to: "/devices", label: "Devices" },
      { to: "/custody", label: "Custody" },
    ],
  },
  {
    group: "Assurance",
    items: [
      { to: "/assurance", label: "Data assurance" },
      { to: "/recovery", label: "Recovery estimates" },
      { to: "/handlers", label: "Handler network" },
      { to: "/reports", label: "Reports" },
    ],
  },
  {
    group: "Workspace",
    items: [{ to: "/settings", label: "Settings & help" }],
  },
];

const ROLE_LABEL: Record<DemoRole, string> = {
  "intake-officer": "Intake officer",
  "compliance-lead": "Compliance lead",
  handler: "Receiving handler",
};

function NavList({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="space-y-6" aria-label="Workspace sections">
      {NAV.map((group) => (
        <div key={group.group}>
          <p className="px-3 pb-2 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45">
            {group.group}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-sm px-3 py-1.5 text-[0.8125rem] transition-colors",
                      active
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-3.5">
        <LogoMark size={32} />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-sidebar-accent-foreground">ReLoop</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-5">
        <NavList onNavigate={onNavigate} />
      </div>
      <div className="border-t border-sidebar-border px-4 py-3">
        <p className="text-[0.6875rem] leading-relaxed text-sidebar-foreground/55">
          Demonstration workspace. No backend or cross-device sign-in is enabled;
          data is held in this browser only.
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state, setRole, hydrated } = useReloop();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen w-full bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-sidebar-border lg:block">
        <SidebarInner />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-ink/50"
          />
          <div className="absolute inset-y-0 left-0 w-64 shadow-xl">
            <SidebarInner onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-60">
        <header className="no-print sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-sm border border-border px-2 py-1 text-xs font-medium lg:hidden"
            aria-label="Open navigation"
          >
            Menu
          </button>
          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="demo-role" className="text-[0.6875rem] text-muted-foreground">
              Demo role (display only — not authentication)
            </label>
            <select
              id="demo-role"
              value={state.role}
              onChange={(e) => setRole(e.target.value as DemoRole)}
              className="rounded-sm border border-border bg-surface px-2 py-1 text-xs font-medium text-foreground"
            >
              {(Object.keys(ROLE_LABEL) as DemoRole[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-8 md:py-10">
          {hydrated ? children : <div className="h-40" aria-hidden="true" />}
        </main>
      </div>
    </div>
  );
}
