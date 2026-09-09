import { CheckCircle2, MessageSquareWarning, XCircle } from "lucide-react";

import { DECISION_LABELS, formatDateTime, type Approval } from "@/lib/newsroom";
import { cn } from "@/lib/utils";

const DECISION_META = {
  approved: { icon: CheckCircle2, className: "text-success" },
  changes_requested: { icon: MessageSquareWarning, className: "text-warning" },
  rejected: { icon: XCircle, className: "text-destructive" },
} as const;

export function ApprovalTimeline({ approvals }: { approvals: Approval[] }) {
  if (approvals.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No review decisions recorded yet. This post cannot be scheduled or published until someone
        approves it.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {approvals.map((approval) => {
        const meta = DECISION_META[approval.decision];
        const Icon = meta.icon;
        return (
          <li key={approval.id} className="flex gap-3">
            <Icon className={cn("mt-0.5 size-4 shrink-0", meta.className)} aria-hidden />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-foreground">
                {DECISION_LABELS[approval.decision]}
                <span className="font-normal text-muted-foreground">
                  {" "}
                  by {approval.actor_label} · {formatDateTime(approval.created_at)}
                </span>
              </p>
              {approval.comment ? (
                <p className="text-sm break-words text-muted-foreground">“{approval.comment}”</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
