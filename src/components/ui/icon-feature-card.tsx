import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface IconFeatureCardProps {
  icon: LucideIcon;
  label: string;
  description: string;
  className?: string;
}

export function IconFeatureCard({ icon: Icon, label, description, className }: IconFeatureCardProps) {
  return (
    <div
      className={cn(
        "rounded-sm border border-border bg-card p-4 text-card-foreground shadow-none",
        className
      )}
    >
      <Icon className="h-4 w-4 text-foreground" strokeWidth={1.5} aria-hidden />
      <h3 className="mt-3 font-serif text-[21px] leading-[1.08] tracking-[-0.02em]">{label}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
