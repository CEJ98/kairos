"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dialog({ open, onOpenChange, className, children, ...props }: DialogProps) {
  // Simple wrapper without portal; always renders content
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
    </div>
  );
}

export function DialogContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-4 shadow-lg focus:outline-none",
        "data-[state=open]:animate-in",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn("text-lg font-semibold", className)} {...props}>
      {children}
    </h2>
  );
}

export function DialogDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-neutral-600", className)} {...props}>
      {children}
    </p>
  );
}

export function DialogFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-4 flex items-center justify-end gap-2", className)} {...props}>
      {children}
    </div>
  );
}