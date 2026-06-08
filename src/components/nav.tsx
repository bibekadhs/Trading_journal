"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/journal", label: "Journal" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-base font-bold tracking-tight">
            Trading Journal
          </Link>
          <Badge variant="outline" className="hidden text-[10px] uppercase tracking-widest sm:inline-flex">
            MNQ / MES
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {tabs.map((t) => {
            const active = pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {t.label}
              </Link>
            );
          })}
          <Link
            href="/log"
            className={cn(
              buttonVariants({ size: "sm" }),
              "ml-2 bg-emerald-500 text-black hover:bg-emerald-400",
            )}
          >
            Log Session
          </Link>
          <div className="ml-2">
            <UserButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
