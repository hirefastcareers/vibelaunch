import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NextAction } from "@/lib/dashboard/next-action";

export function NextActionBanner({ action }: { action: NextAction }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium text-primary">Up next</p>
        <h2 className="mt-1 text-base font-medium text-foreground">{action.title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{action.description}</p>
      </div>
      <Button asChild className="shrink-0">
        <Link href={action.href}>
          {action.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
