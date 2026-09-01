import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
  {
    variants: {
      variant: {
        default: "border-primary text-primary bg-transparent",
        secondary: "border-stone-800 text-muted-foreground bg-transparent",
        outline: "border-stone-800 text-foreground bg-transparent",
        viral: "border-primary text-primary bg-transparent",
        solid: "border-stone-800 text-foreground bg-transparent",
        baseline: "border-stone-800 text-muted-foreground bg-transparent",
        low: "border-stone-800 text-muted-foreground bg-transparent",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
