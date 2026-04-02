"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Crosshair,
  Map,
  Users,
  Backpack,
  Trophy,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogIn,
  Menu,
  X,
  Zap,
  BarChart3,
  Newspaper,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  badge?: string;
}

const navItems: NavItem[] = [
  { label: "Contracts", href: "/", icon: Crosshair },
  { label: "World Map", href: "/map", icon: Map, disabled: true, badge: "Soon" },
  { label: "Loadouts", href: "/loadouts", icon: Backpack, disabled: true, badge: "Soon" },
  { label: "Squads", href: "/squads", icon: Users, disabled: true, badge: "Soon" },
  { label: "Leaderboards", href: "/leaderboards", icon: Trophy, disabled: true, badge: "Soon" },
  { label: "Stats", href: "/stats", icon: BarChart3, disabled: true, badge: "Soon" },
];

const secondaryNavItems: NavItem[] = [
  { label: "News", href: "/news", icon: Newspaper, disabled: true },
  { label: "Help", href: "/help", icon: HelpCircle, disabled: true },
  { label: "Settings", href: "/settings", icon: Settings, disabled: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary">
              <Zap className="size-4 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-bold tracking-tight text-foreground">ARCSITE</span>
              <span className="ml-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                Beta
              </span>
            </div>
          </Link>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <a
            href="https://ardb.gg"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Data via ARDB
          </a>

          <Button variant="ghost" size="icon" className="relative" disabled>
            <Bell className="size-4" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
          </Button>

          <Button variant="ghost" size="sm" className="gap-2" disabled>
            <LogIn className="size-4" />
            <span className="hidden sm:inline">Sign In</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 mt-14 flex flex-col border-r border-border bg-card transition-all duration-200
            lg:relative lg:mt-0 lg:z-auto
            ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            ${sidebarCollapsed ? "w-16" : "w-56"}
          `}
        >
          <nav className="flex flex-1 flex-col gap-1 p-2">
            {/* Main nav items */}
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.disabled ? "#" : item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                      ${
                        item.disabled
                          ? "cursor-not-allowed opacity-50"
                          : isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    <Icon className={`size-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="my-2 border-t border-border" />

            {/* Secondary nav items */}
            <div className="space-y-1">
              {secondaryNavItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.disabled ? "#" : item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
                      ${
                        item.disabled
                          ? "cursor-not-allowed opacity-50"
                          : isActive
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    <Icon className={`size-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                    {!sidebarCollapsed && <span className="flex-1">{item.label}</span>}
                  </Link>
                );
              })}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Collapse button - desktop only */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden justify-start gap-3 text-muted-foreground lg:flex"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <>
                  <ChevronLeft className="size-4" />
                  <span>Collapse</span>
                </>
              )}
            </Button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
