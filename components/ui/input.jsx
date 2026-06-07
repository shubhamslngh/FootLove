import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex min-h-12 w-full rounded-2xl border-0 bg-card px-4 py-3 text-base font-medium text-foreground outline-none shadow-[0_8px_22px_rgba(17,24,39,0.06)] ring-1 ring-border transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
