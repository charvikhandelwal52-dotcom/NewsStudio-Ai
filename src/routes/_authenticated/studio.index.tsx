import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { PenSquare, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/app/EmptyState";
import { FilterBar } from "@/components/app/FilterBar";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createPost, formatRelative, postsQuery } from "@/lib/newsroom";

export const Route = createFileRoute("/_authenticated/studio/")({
  head: () => ({
    meta: [
      { title: "Content studio — NewsPilot AI" },
      { name: "description", content: "Write posts, carousels and reel scripts for the newsroom." },
      { property: "og:title", content: "Content studio — NewsPilot AI" },
      {
        property: "og:description",
        content: "Write posts, carousels and reel scripts for the newsroom.",
      },
    ],
  }),
  component: StudioListPage,
});

const ALL = "all";

function StudioListPage() {
  const { data: posts = [], isLoading } = useQuery(postsQuery);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [format, setFormat] = useState(ALL);

  const create = useMutation({
    mutationFn: () => createPost({ headline: "Untitled draft", body: "" }),
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ["content_posts"] });
      navigate({ to: "/studio/$postId", params: { postId: post!.id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = useMemo(
    () =>
      posts.filter((post) => {
        if (search && !post.headline.toLowerCase().includes(search.toLowerCase())) return false;
        if (status !== ALL && post.status !== status) return false;
        if (format !== ALL && post.format !== format) return false;
        return true;
      }),
    [posts, search, status, format],
  );

  return (
    <>
      <PageHeader
        title="Content studio"
        description="Draft single posts, carousels and reel scripts. Nothing leaves here without human approval."
        actions={
          <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending}>
            <Plus className="size-4" aria-hidden /> New draft
          </Button>
        }
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search drafts…"
        filters={[
          {
            id: "status",
            label: "Status",
            value: status,
            onChange: setStatus,
            options: [
              { value: ALL, label: "All statuses" },
              { value: "draft", label: "Draft" },
              { value: "in_review", label: "In review" },
              { value: "approved", label: "Approved" },
              { value: "scheduled", label: "Scheduled" },
              { value: "published", label: "Published" },
              { value: "rejected", label: "Rejected" },
            ],
          },
          {
            id: "format",
            label: "Type",
            value: format,
            onChange: setFormat,
            options: [
              { value: ALL, label: "All types" },
              { value: "post", label: "Single post" },
              { value: "carousel", label: "Carousel" },
              { value: "reel", label: "Reel" },
            ],
          },
        ]}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading drafts…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={PenSquare}
          title="No content here yet"
          description="Start a fresh draft, or send a story over from the news inbox."
          action={
            <Button size="sm" onClick={() => create.mutate()}>
              New draft
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((post) => (
            <Card key={post.id} className="gap-0 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-foreground">
                    {post.headline}
                  </h3>
                  <p className="text-xs text-muted-foreground capitalize">
                    {post.format} · {post.channel} · edited {formatRelative(post.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={post.status} />
                  <Button asChild size="sm" variant="outline">
                    <Link to="/studio/$postId" params={{ postId: post.id }}>
                      Edit
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
