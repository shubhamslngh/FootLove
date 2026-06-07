import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-bold transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_10px_24px_rgba(16,185,129,0.24)] hover:bg-primary/90",
        secondary: "bg-card text-foreground shadow-[0_8px_22px_rgba(17,24,39,0.08)] ring-1 ring-border hover:bg-secondary",
        outline: "bg-card text-foreground shadow-[0_8px_22px_rgba(17,24,39,0.06)] ring-1 ring-border hover:bg-secondary",
        ghost: "text-foreground hover:bg-secondary",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
