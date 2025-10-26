"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { mainNav } from "@/components/layout/nav-items";

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 flex-col gap-2 lg:flex">
      {mainNav.map((item) => {
        const active = pathname === item.href || (item.href === "/dashboard" && pathname === "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-3xl px-5 py-3 text-sm font-semibold transition",
              active
                ? "bg-foreground text-background shadow-soft"
                : "text-neutral-600 hover:bg-surface"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
