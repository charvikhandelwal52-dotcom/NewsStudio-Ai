import { cn } from "@/lib/utils";
import { STATUS_LABELS, type PostStatus } from "@/lib/newsroom";

const STATUS_CLASSES: Record<PostStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  in_review: "bg-warning/15 text-warning-foreground border-warning/40 dark:text-warning",
  approved: "bg-success/15 text-success border-success/40",
  scheduled: "bg-info/15 text-info border-info/40",
  published: "bg-primary/15 text-primary border-primary/40",
  rejected: "bg-destructive/15 text-destructive border-destructive/40",
};

export function StatusBadge({ status, className }: { status: PostStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_CLASSES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
