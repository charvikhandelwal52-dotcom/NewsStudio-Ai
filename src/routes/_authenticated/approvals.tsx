import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ApprovalTimeline } from "@/components/app/ApprovalTimeline";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { EmptyState } from "@/components/app/EmptyState";
import { FilterBar } from "@/components/app/FilterBar";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  approvalsQuery,
  formatRelative,
  newsItemsQuery,
  postsQuery,
  recordApproval,
  sourcesQuery,
  type ContentPost,
} from "@/lib/newsroom";

export const Route = createFileRoute("/_authenticated/approvals")({
  head: () => ({
    meta: [
      { title: "Approval center — NewsPilot AI" },
      {
        name: "description",
        content: "Review, approve or reject newsroom content with a full decision trail.",
      },
      { property: "og:title", content: "Approval center — NewsPilot AI" },
      {
        property: "og:description",
        content: "Review, approve or reject newsroom content with a full decision trail.",
      },
    ],
  }),
  component: ApprovalsPage,
});

const ALL = "all";

function ApprovalsPage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: posts = [] } = useQuery(postsQuery);
  const { data: approvals = [] } = useQuery(approvalsQuery);
  const { data: news = [] } = useQuery(newsItemsQuery);
  const { data: sources = [] } = useQuery(sourcesQuery);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("in_review");
  const [rejectTarget, setRejectTarget] = useState<ContentPost | null>(null);
  const [reason, setReason] = useState("");

  const review = useMutation({
    mutationFn: (input: {
      postId: string;
      decision: "approved" | "rejected" | "changes_requested";
      comment: string;
    }) =>
      recordApproval({
        postId: input.postId,
        decision: input.decision,
        comment: input.comment,
        actorLabel: user?.displayName ?? "Team member",
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["content_posts"] });
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      setRejectTarget(null);
      setReason("");
      toast.success(
        variables.decision === "approved" ? "Approved and logged." : "Decision logged.",
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const storySource = (post: ContentPost) => {
    const item = news.find((entry) => entry.id === post.news_item_id);
    if (!item) return "Original newsroom copy";
    return sources.find((entry) => entry.id === item.source_id)?.name ?? "Unknown source";
  };

  const filtered = useMemo(
    () =>
      posts.filter((post) => {
        if (status !== ALL && post.status !== status) return false;
        if (search && !post.headline.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [posts, status, search],
  );

  return (
    <>
      <PageHeader
        title="Approval center"
        description="Nothing reaches the calendar or the feed without a person approving it here."
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search content awaiting review…"
        filters={[
          {
            id: "status",
            label: "Status",
            value: status,
            onChange: setStatus,
            options: [
              { value: "in_review", label: "Awaiting review" },
              { value: "approved", label: "Approved" },
              { value: "rejected", label: "Rejected" },
              { value: ALL, label: "All content" },
            ],
          },
        ]}
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Nothing in this queue"
          description="When an editor sends a draft for review it lands here."
        />
      ) : (
        <div className="grid gap-4">
          {filtered.map((post) => (
            <Card key={post.id} className="gap-0 p-5">
              <div className="grid gap-5 md:grid-cols-[140px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-md border border-border">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.headline}
                      className="aspect-square w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex aspect-square items-center justify-center bg-muted text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{post.headline}</h3>
                      <p className="text-xs text-muted-foreground capitalize">
                        {storySource(post)} · {post.format} · {post.channel} · updated{" "}
                        {formatRelative(post.updated_at)}
                      </p>
                    </div>
                    <StatusBadge status={post.status} />
                  </div>

                  <p className="line-clamp-4 text-sm whitespace-pre-line text-muted-foreground">
                    {post.body || "No caption written yet."}
                  </p>
                  {post.hashtags.length > 0 ? (
                    <p className="text-xs text-primary">{post.hashtags.join(" ")}</p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <ConfirmDialog
                      trigger={
                        <Button size="sm" disabled={post.status === "approved"}>
                          Approve
                        </Button>
                      }
                      title="Approve this content?"
                      description="Your name and the current time are written to the approval history, and the post becomes eligible for scheduling."
                      confirmLabel="Approve"
                      onConfirm={() =>
                        review.mutate({
                          postId: post.id,
                          decision: "approved",
                          comment: "Approved for scheduling",
                        })
                      }
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => {
                        setRejectTarget(post);
                        setReason("");
                      }}
                    >
                      Reject
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/studio/$postId" params={{ postId: post.id }}>
                        Open in studio
                      </Link>
                    </Button>
                  </div>

                  <details className="text-sm">
                    <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                      Approval history
                    </summary>
                    <div className="mt-3">
                      <ApprovalTimeline
                        approvals={approvals.filter((entry) => entry.post_id === post.id)}
                      />
                    </div>
                  </details>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(rejectTarget)} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject this content</DialogTitle>
            <DialogDescription>
              The reason is stored in the approval history so the writer knows what to change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection">Reason</Label>
            <Textarea
              id="rejection"
              rows={4}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Facts need a second source…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!reason.trim() || review.isPending}
              onClick={() =>
                rejectTarget &&
                review.mutate({ postId: rejectTarget.id, decision: "rejected", comment: reason })
              }
            >
              Reject content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
