"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { mainNav } from "@/components/layout/nav-items";
import { MobileNav } from "@/components/layout/mobile-nav";
import { cn } from "@/lib/utils";

interface TopNavProps {
  showAuth?: boolean;
}

export function TopNav({ showAuth = true }: TopNavProps) {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between gap-3 rounded-full bg-white/80 px-4 py-3 shadow-soft backdrop-blur">
      <div className="flex items-center gap-3">
        <MobileNav items={mainNav} showAuth={showAuth} />
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="rounded-full bg-foreground px-2 py-1 text-xs font-semibold uppercase tracking-wide text-background">
            Kairos
          </span>
          <span className="hidden text-sm font-semibold text-neutral-600 sm:block">
            Fitness Intelligence
          </span>
        </Link>
      </div>

      <nav className="hidden items-center gap-1 md:flex">
        {mainNav.map((item) => {
          const active = pathname === item.href || (item.href === "/dashboard" && pathname === "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                active ? "bg-foreground text-background shadow-sm" : "text-neutral-600 hover:bg-surface"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notificaciones"
          className="hidden md:inline-flex"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        {showAuth ? (
          <Button asChild size="sm" variant="accent" className="hidden md:inline-flex">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        ) : (
          <Avatar>KA</Avatar>
        )}
      </div>
    </header>
  );
}
