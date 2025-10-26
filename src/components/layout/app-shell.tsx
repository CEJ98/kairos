"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { TopNav } from "@/components/layout/top-nav";
import { SideNav } from "@/components/layout/side-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";
import { useTrack } from "@/lib/hooks/use-track";

interface AppShellProps {
  children: ReactNode;
  variant?: "landing" | "dashboard";
  showAuthControls?: boolean;
}

export function AppShell({
  children,
  variant = "dashboard",
  showAuthControls = false
}: AppShellProps) {
  const pathname = usePathname();
  const track = useTrack();

  useEffect(() => {
    track("app_open");
  }, [track]);

  useEffect(() => {
    if (pathname?.startsWith("/progress")) {
      track("view_progress");
    }
  }, [pathname, track]);
  if (variant === "landing") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-surface to-white px-4">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 py-8">
          <TopNav showAuth />
          <main>{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-surface via-white to-surface">
      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-6 px-4 py-6 md:px-6">
        <TopNav showAuth={showAuthControls} />
        <div className="flex flex-1 gap-6">
          <SideNav />
          <main
            className={cn(
              "flex-1 rounded-3xl bg-white/80 p-6 shadow-soft backdrop-blur",
              "md:rounded-[32px]"
            )}
          >
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
