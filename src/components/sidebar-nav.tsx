"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Sparkles,
  LogOut,
  Menu,
  ChevronLeft,
} from "lucide-react";

export function SidebarNav() {
  const pathname = usePathname();
  const isDream = pathname.startsWith("/dream");
  const [collapsed, setCollapsed] = useState(false);

  const base = isDream ? "/dream/" : "/";

  const mainItems = [
    { href: `${base}dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { href: `${base}journal`, label: "Journal", icon: BookOpen },
    { href: `${base}log`, label: "Log Session", icon: PlusCircle },
  ];

  const switchItem = isDream
    ? { href: "/dashboard", label: "Trading Journal", icon: Sparkles }
    : { href: "/dream/dashboard", label: "Dream Project", icon: Sparkles };

  return (
    <>
      {/* Fixed sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r bg-card transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center gap-2 border-b py-4 transition-all",
            collapsed ? "justify-center px-2" : "px-5",
          )}
        >
          {!collapsed && (
            <>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                {isDream ? "D" : "TJ"}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight">
                  {isDream ? "Dream Project" : "Trading Journal"}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {isDream ? "Practice & Simulate" : "MNQ / MES"}
                </span>
              </div>
            </>
          )}
          {/* Toggle button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground transition hover:bg-accent hover:text-foreground",
              collapsed && "mx-auto",
              !collapsed && "ml-auto",
            )}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {mainItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && item.label}
              </Link>
            );
          })}

          {/* Dream Project / Trading Journal — always in main nav list */}
          {!isDream && (
            <Link
              href={switchItem.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-400 transition hover:bg-accent hover:text-amber-300",
                collapsed && "justify-center px-0",
              )}
              title={collapsed ? switchItem.label : undefined}
            >
              <switchItem.icon className="h-4 w-4 shrink-0" />
              {!collapsed && switchItem.label}
            </Link>
          )}
        </nav>

        {/* Bottom section */}
        <div className={cn("border-t px-3 py-4 space-y-1", collapsed && "px-2")}>
          {/* Trading Journal link when in Dream mode */}
          {isDream && (
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-400 transition hover:bg-accent hover:text-amber-300",
                collapsed && "justify-center px-0",
              )}
              title={collapsed ? "Trading Journal" : undefined}
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              {!collapsed && "Trading Journal"}
            </Link>
          )}

          <SignOutButton>
            <button
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
              title={collapsed ? "Logout" : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && "Logout"}
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Spacer to reserve sidebar width */}
      <div className={cn("shrink-0 transition-all duration-300", collapsed ? "w-16" : "w-64")} />
    </>
  );
}
