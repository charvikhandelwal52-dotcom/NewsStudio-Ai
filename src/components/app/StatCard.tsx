import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "primary" | "warning" | "success" | "info";
}) {
  const toneClass = {
    default: "text-muted-foreground bg-muted",
    primary: "text-primary bg-primary/10",
    warning: "text-warning bg-warning/15",
    success: "text-success bg-success/15",
    info: "text-info bg-info/15",
  }[tone];

  return (
    <Card className="gap-0 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="font-headline text-3xl text-foreground tabular-nums">{value}</p>
        </div>
        <span className={cn("rounded-md p-2", toneClass)}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      {hint ? <p className="mt-3 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
