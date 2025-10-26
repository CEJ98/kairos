"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/components/layout/nav-items";

interface MobileNavProps {
  items: NavItem[];
  showAuth: boolean;
}

export function MobileNav({ items, showAuth }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Abrir navegación"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-40 flex flex-col bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        >
          <div className="ml-auto p-4">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cerrar navegación"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav
            className="mx-4 mb-6 rounded-3xl bg-white p-6 shadow-soft"
            onClick={(event) => event.stopPropagation()}
          >
            <ul className="flex flex-col gap-2">
              {items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                        active
                          ? "bg-foreground text-background shadow-md"
                          : "text-neutral-600 hover:bg-surface"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            {showAuth ? (
              <Button asChild className="mt-6 w-full rounded-full">
                <Link href="/login" onClick={() => setOpen(false)}>
                  Iniciar sesión
                </Link>
              </Button>
            ) : null}
          </nav>
        </div>
      ) : null}
    </>
  );
}
