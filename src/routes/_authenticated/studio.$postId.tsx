import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Film, Images, RefreshCw, Save, Send, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ApprovalTimeline } from "@/components/app/ApprovalTimeline";
import { ComingSoonButton } from "@/components/app/ComingSoonButton";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  deletePost,
  postApprovalsQuery,
  postQuery,
  recordApproval,
  updatePost,
  type ContentPost,
} from "@/lib/newsroom";

export const Route = createFileRoute("/_authenticated/studio/$postId")({
  head: () => ({
    meta: [
      { title: "Edit content — NewsPilot AI" },
      { name: "description", content: "Edit a post, carousel or reel script before review." },
      { property: "og:title", content: "Edit content — NewsPilot AI" },
      {
        property: "og:description",
        content: "Edit a post, carousel or reel script before review.",
      },
    ],
  }),
  component: StudioEditorPage,
});

function splitSlides(body: string) {
  const slides = body
    .split(/\n\s*\n/)
    .map((slide) => slide.trim())
    .filter(Boolean)
    .slice(0, 4);
  return slides.length > 0 ? slides : ["Slide content goes here."];
}

function StudioEditorPage() {
  const { postId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: post, isLoading } = useQuery(postQuery(postId));
  const { data: approvals = [] } = useQuery(postApprovalsQuery(postId));

  const [draft, setDraft] = useState<Partial<ContentPost>>({});
  const [hashtags, setHashtags] = useState("");
  const [topics, setTopics] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (!post) return;
    setDraft({
      headline: post.headline,
      body: post.body,
      image_url: post.image_url,
      channel: post.channel,
      format: post.format,
    });
    setHashtags(post.hashtags.join(" "));
    setTopics(post.topics.join(", "));
  }, [post]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["content_posts"] });
    queryClient.invalidateQueries({ queryKey: ["approvals"] });
  };

  const save = useMutation({
    mutationFn: (patch: Partial<ContentPost>) =>
      updatePost(postId, {
        ...draft,
        hashtags: hashtags
          .split(/[\s,]+/)
          .map((tag) => tag.trim())
          .filter(Boolean),
        topics: topics
          .split(",")
          .map((topic) => topic.trim())
          .filter(Boolean),
        ...patch,
      }),
    onSuccess: () => {
      invalidate();
      toast.success("Saved.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const review = useMutation({
    mutationFn: (input: { decision: "approved" | "rejected"; comment: string }) =>
      recordApproval({
        postId,
        decision: input.decision,
        comment: input.comment,
        actorLabel: user?.displayName ?? "Team member",
      }),
    onSuccess: () => {
      invalidate();
      setRejectReason("");
      toast.success("Decision recorded.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      invalidate();
      navigate({ to: "/studio" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading draft…</p>;
  if (!post) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">This draft no longer exists.</p>
        <Button asChild size="sm" variant="outline">
          <Link to="/studio">Back to studio</Link>
        </Button>
      </div>
    );
  }

  const body = draft.body ?? "";
  const slides = splitSlides(body);
  const format = draft.format ?? "post";

  return (
    <>
      <PageHeader
        title="Edit content"
        description="Everything here stays internal until a human approves it."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={post.status} />
            <Button asChild variant="ghost" size="sm">
              <Link to="/studio">
                <ArrowLeft className="size-4" aria-hidden /> Back
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="p-5">
          <Tabs
            value={format}
            onValueChange={(value) => setDraft((prev) => ({ ...prev, format: value }))}
          >
            <TabsList>
              <TabsTrigger value="post">Single post</TabsTrigger>
              <TabsTrigger value="carousel">
                <Images className="mr-1.5 size-4" aria-hidden /> Carousel
              </TabsTrigger>
              <TabsTrigger value="reel">
                <Film className="mr-1.5 size-4" aria-hidden /> Reel
              </TabsTrigger>
            </TabsList>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headline">Headline</Label>
                <Input
                  id="headline"
                  value={draft.headline ?? ""}
                  onChange={(e) => setDraft((prev) => ({ ...prev, headline: e.target.value }))}
                />
              </div>

              <TabsContent value="post" className="m-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="body">Caption</Label>
                  <Textarea
                    id="body"
                    rows={10}
                    value={body}
                    onChange={(e) => setDraft((prev) => ({ ...prev, body: e.target.value }))}
                  />
                </div>
              </TabsContent>

              <TabsContent value="carousel" className="m-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="carousel-body">Slides (separate each slide with a blank line, up to 4)</Label>
                  <Textarea
                    id="carousel-body"
                    rows={10}
                    value={body}
                    onChange={(e) => setDraft((prev) => ({ ...prev, body: e.target.value }))}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {slides.map((slide, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-md border border-border bg-muted p-3 text-xs leading-relaxed text-foreground"
                    >
                      <p className="mb-2 font-semibold text-muted-foreground">
                        Slide {index + 1} / {slides.length}
                      </p>
                      <p className="line-clamp-[9]">{slide}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="reel" className="m-0 space-y-4">
                <div className="grid gap-4 sm:grid-cols-[200px_minmax(0,1fr)]">
                  <div className="flex aspect-[9/16] items-center justify-center rounded-md border border-dashed border-border bg-muted text-center text-xs text-muted-foreground">
                    9:16 video preview
                    <br />
                    appears here once
                    <br />
                    reel rendering ships
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reel-script">Script</Label>
                    <Textarea
                      id="reel-script"
                      rows={10}
                      value={body}
                      onChange={(e) => setDraft((prev) => ({ ...prev, body: e.target.value }))}
                    />
                  </div>
                </div>
              </TabsContent>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hashtags">Hashtags</Label>
                  <Input
                    id="hashtags"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    placeholder="#newsroom #breaking"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topics">Categories</Label>
                  <Input
                    id="topics"
                    value={topics}
                    onChange={(e) => setTopics(e.target.value)}
                    placeholder="Technology, Business"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    value={draft.image_url ?? ""}
                    onChange={(e) => setDraft((prev) => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="channel">Channel</Label>
                  <Select
                    value={draft.channel ?? "instagram"}
                    onValueChange={(value) => setDraft((prev) => ({ ...prev, channel: value }))}
                  >
                    <SelectTrigger id="channel">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="x">X</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                <Button size="sm" onClick={() => save.mutate({})} disabled={save.isPending}>
                  <Save className="size-4" aria-hidden /> Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => save.mutate({ status: "in_review" })}
                  disabled={save.isPending}
                >
                  <Send className="size-4" aria-hidden /> Send for review
                </Button>
                <ComingSoonButton
                  icon={<RefreshCw className="size-4" aria-hidden />}
                  explanation="Will regenerate this draft with the AI writer, keeping your headline and category as guidance."
                >
                  Regenerate
                </ComingSoonButton>
                <ConfirmDialog
                  trigger={
                    <Button size="sm" variant="ghost" className="text-destructive">
                      <Trash2 className="size-4" aria-hidden /> Delete
                    </Button>
                  }
                  title="Delete this draft?"
                  description="This removes the draft and its review history. It can't be undone."
                  confirmLabel="Delete"
                  destructive
                  onConfirm={() => remove.mutate()}
                />
              </div>
            </div>
          </Tabs>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-headline text-lg text-foreground">Preview</h2>
            <div className="mt-3 overflow-hidden rounded-md border border-border">
              {draft.image_url ? (
                <img
                  src={draft.image_url}
                  alt={draft.headline ?? "Post preview"}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center bg-muted text-xs text-muted-foreground">
                  No image yet
                </div>
              )}
              <div className="space-y-2 p-3">
                <p className="text-sm font-semibold text-foreground">{draft.headline}</p>
                <p className="line-clamp-6 text-xs whitespace-pre-line text-muted-foreground">
                  {body}
                </p>
                <p className="text-xs text-primary">{hashtags}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-headline text-lg text-foreground">Human review</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A post can only be scheduled or published after someone approves it here.
            </p>
            <div className="mt-4 space-y-3">
              <ConfirmDialog
                trigger={
                  <Button size="sm" className="w-full">
                    Approve this content
                  </Button>
                }
                title="Approve this content?"
                description="Your name and the time are recorded in the approval history, and the post becomes eligible for scheduling."
                confirmLabel="Approve"
                onConfirm={() => review.mutate({ decision: "approved", comment: "Approved" })}
              />
              <div className="space-y-2">
                <Label htmlFor="reject-reason">Rejection reason</Label>
                <Textarea
                  id="reject-reason"
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain what's wrong with this draft…"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-destructive"
                  disabled={!rejectReason.trim() || review.isPending}
                  onClick={() => review.mutate({ decision: "rejected", comment: rejectReason })}
                >
                  Reject
                </Button>
              </div>
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Approval history</h3>
              <ApprovalTimeline approvals={approvals} />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
