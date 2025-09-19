import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 dark:bg-primary/90 dark:text-primary-foreground dark:hover:bg-primary/70",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95 dark:bg-red-700 dark:text-white dark:hover:bg-red-800",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:scale-95 dark:border-gray-700 dark:hover:bg-gray-800",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-95 dark:hover:bg-gray-800 dark:hover:text-gray-200",
        link: "text-primary underline-offset-4 hover:underline dark:text-blue-400",
        gradient: "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 active:scale-95 shadow-lg hover:shadow-xl dark:shadow-gray-900/30",
        success: "bg-green-600 text-white hover:bg-green-700 active:scale-95 dark:bg-green-700 dark:hover:bg-green-800",
        warning: "bg-yellow-600 text-white hover:bg-yellow-700 active:scale-95 dark:bg-yellow-700 dark:hover:bg-yellow-800",
        info: "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 dark:bg-blue-700 dark:hover:bg-blue-800",
        floating: "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 shadow-lg hover:shadow-xl rounded-full",
      },
      size: {
        xs: "h-8 px-2 text-xs",
        sm: "h-9 px-3 text-sm",
        default: "h-10 px-4 py-2",
        lg: "h-11 px-8 text-base",
        xl: "h-12 px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const content = (
      <>
        {isLoading && !asChild && (
          <svg
            className={cn(
              "mr-2 h-4 w-4 animate-spin",
              size === "xs" && "h-3.5 w-3.5",
              size === "sm" && "h-3.5 w-3.5",
              size === "lg" && "h-4.5 w-4.5",
              size === "xl" && "h-5 w-5",
              (size === "icon" || size === "icon-sm" || size === "icon-lg") && "mr-0"
            )}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        {asChild ? children : <span className={cn(isLoading && "opacity-80")}>{children}</span>}
      </>
    )
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          isLoading && "relative"
        )}
        ref={ref}
        aria-busy={isLoading || undefined}
        aria-disabled={isLoading || disabled || undefined}
        disabled={isLoading || disabled}
        {...props}
      >
        {content}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
