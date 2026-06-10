"use client";

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
} from "lucide-react";

export function SidebarNav() {
  const pathname = usePathname();
  const isDream = pathname.startsWith("/dream");

  const base = isDream ? "/dream/" : "/";

  const items = [
    { href: `${base}dashboard`, label: "Dashboard", icon: LayoutDashboard },
    { href: `${base}journal`, label: "Journal", icon: BookOpen },
    { href: `${base}log`, label: "Log Session", icon: PlusCircle },
    {
      href: isDream ? "/dashboard" : "/dream/dashboard",
      label: isDream ? "Trading Journal" : "Dream Project",
      icon: Sparkles,
      highlight: true,
    },
  ];

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
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
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
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
                  : item.highlight
                    ? "text-amber-400 hover:bg-accent hover:text-amber-300"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t px-3 py-4">
        <SignOutButton>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </SignOutButton>
      </div>
    </aside>
  );
}
