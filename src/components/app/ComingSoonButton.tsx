import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Every action that depends on a not-yet-built integration (scraping, AI
 * drafting, reel rendering, Instagram publishing) uses this control. It is
 * never a dead button: it is visibly badged "Soon" and explains what it will do
 * when the integration ships.
 */
export function ComingSoonButton({
  children,
  explanation,
  variant = "outline",
  size = "sm",
  className,
  icon,
}: {
  children: ReactNode;
  explanation: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-flex", className)}>
            <Button
              type="button"
              variant={variant}
              size={size}
              disabled
              aria-disabled
              className="pointer-events-none gap-2 opacity-100 grayscale-[0.35]"
            >
              {icon ?? <Sparkles className="size-4" aria-hidden />}
              {children}
              <span className="rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                Soon
              </span>
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <p className="text-xs leading-relaxed">{explanation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
