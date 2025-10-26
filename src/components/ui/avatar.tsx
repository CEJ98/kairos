"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function Avatar({ className, children, ...props }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full bg-foreground/10 text-sm font-semibold uppercase text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
  return (
    <span
      className={cn("text-xs font-semibold uppercase tracking-wide text-foreground/70", className)}
      {...props}
    >
      {children}
    </span>
  );
}

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

export function AvatarImage({ className, ...props }: AvatarImageProps) {
  return <img {...props} className={cn("h-full w-full rounded-full object-cover", className)} />;
}
