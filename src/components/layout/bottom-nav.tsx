"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mainNav } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-4 z-30 mx-auto flex w-[90%] max-w-sm items-center justify-between rounded-full bg-white/90 px-4 py-3 shadow-soft backdrop-blur md:hidden">
      {mainNav.slice(0, 4).map((item) => {
        const active = pathname === item.href || (item.href === "/dashboard" && pathname === "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 text-xs font-semibold transition",
              active ? "text-foreground" : "text-neutral-500 hover:text-foreground"
            )}
          >
            <Icon className={cn("h-4 w-4", active ? "text-foreground" : "text-neutral-400")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
