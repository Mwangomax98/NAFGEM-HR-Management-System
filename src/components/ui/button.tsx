import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background smooth-transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-button text-accent-foreground hover:shadow-accent-glow shadow-button font-medium button-glow",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg shadow-button font-medium",
        outline:
          "border-2 border-secondary/30 bg-background text-secondary hover:bg-secondary hover:text-secondary-foreground hover:border-secondary shadow-soft",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-soft interactive-scale",
        ghost: "hover:bg-muted hover:text-foreground smooth-transition",
        link: "text-primary underline-offset-4 hover:underline smooth-transition",
        // Blue, Teal, Gray + Orange System variants
        premium: "bg-gradient-primary text-primary-foreground hover:shadow-glow shadow-button font-medium",
        success: "bg-gradient-success text-success-foreground hover:shadow-accent-glow shadow-button font-medium accent-glow",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-button font-medium",
        navy: "bg-navy-pro text-white hover:bg-primary-hover shadow-button font-medium",
        teal: "bg-teal-pro text-white hover:bg-accent-hover shadow-button font-medium",
        elegant: "bg-card border-2 border-primary/10 text-card-foreground hover:border-primary/30 hover:bg-gradient-card shadow-card interactive-lift",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-10 w-10",
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
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
