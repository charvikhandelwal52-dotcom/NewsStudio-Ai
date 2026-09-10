import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ExternalLink, Inbox as InboxIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ComingSoonButton } from "@/components/app/ComingSoonButton";
import { EmptyState } from "@/components/app/EmptyState";
import { FilterBar } from "@/components/app/FilterBar";
import { PageHeader } from "@/components/app/PageHeader";
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
import {
  createPost,
  formatDateTime,
  newsItemsQuery,
  setNewsItemStatus,
  sourcesQuery,
  type NewsItem,
} from "@/lib/newsroom";

export const Route = createFileRoute("/_authenticated/inbox")({
  head: () => ({
    meta: [
      { title: "News inbox — NewsPilot AI" },
      { name: "description", content: "Triage incoming stories from your configured sources." },
      { property: "og:title", content: "News inbox — NewsPilot AI" },
      {
        property: "og:description",
        content: "Triage incoming stories from your configured sources.",
      },
    ],
  }),
  component: InboxPage,
});

const ALL = "all";

function InboxPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: news = [], isLoading } = useQuery(newsItemsQuery);
  const { data: sources = [] } = useQuery(sourcesQuery);

  const [search, setSearch] = useState("");
  const [topic, setTopic] = useState(ALL);
  const [source, setSource] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [range, setRange] = useState(ALL);
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState<NewsItem | null>(null);

  const triage = useMutation({
    mutationFn: (input: { id: string; patch: Parameters<typeof setNewsItemStatus>[1] }) =>
      setNewsItemStatus(input.id, input.patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["news_items"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const sendToStudio = useMutation({
    mutationFn: async (item: NewsItem) => {
      const post = await createPost({
        news_item_id: item.id,
        headline: item.title,
        body: item.summary,
        topics: [item.topic],
        image_url: item.image_url,
      });
      await setNewsItemStatus(item.id, { status: "triaged", is_read: true });
      return post;
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ["news_items"] });
      queryClient.invalidateQueries({ queryKey: ["content_posts"] });
      setSelected(null);
      toast.success("Draft created in Content Studio.");
      navigate({ to: "/studio/$postId", params: { postId: post.id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const topics = useMemo(
    () => Array.from(new Set(news.map((item) => item.topic))).sort(),
    [news],
  );

  const filtered = useMemo(() => {
    const cutoff =
      range === ALL
        ? 0
        : Date.now() - Number(range) * 24 * 60 * 60 * 1000;
    const rows = news.filter((item) => {
      if (search && !`${item.title} ${item.summary}`.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (topic !== ALL && item.topic !== topic) return false;
      if (source !== ALL && item.source_id !== source) return false;
      if (status !== ALL && item.status !== status) return false;
      if (cutoff && Date.parse(item.published_at) < cutoff) return false;
      return true;
    });
    return rows.sort((a, b) =>
      sort === "newest"
        ? Date.parse(b.published_at) - Date.parse(a.published_at)
        : sort === "oldest"
          ? Date.parse(a.published_at) - Date.parse(b.published_at)
          : b.relevance_score - a.relevance_score,
    );
  }, [news, search, topic, source, status, range, sort]);

  const sourceName = (id: string | null) =>
    sources.find((entry) => entry.id === id)?.name ?? "Unknown source";

  return (
    <>
      <PageHeader
        title="News inbox"
        description="Everything your sources brought in. Triage it, then send it to the studio."
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search headlines and summaries…"
        filters={[
          {
            id: "topic",
            label: "Category",
            value: topic,
            onChange: setTopic,
            options: [
              { value: ALL, label: "All categories" },
              ...topics.map((value) => ({ value, label: value })),
            ],
          },
          {
            id: "source",
            label: "Source",
            value: source,
            onChange: setSource,
            options: [
              { value: ALL, label: "All sources" },
              ...sources.map((entry) => ({ value: entry.id, label: entry.name })),
            ],
          },
          {
            id: "status",
            label: "Status",
            value: status,
            onChange: setStatus,
            options: [
              { value: ALL, label: "All statuses" },
              { value: "new", label: "New" },
              { value: "triaged", label: "Triaged" },
              { value: "dismissed", label: "Dismissed" },
            ],
          },
          {
            id: "range",
            label: "Date",
            value: range,
            onChange: setRange,
            options: [
              { value: ALL, label: "Any date" },
              { value: "1", label: "Last 24 hours" },
              { value: "7", label: "Last 7 days" },
              { value: "30", label: "Last 30 days" },
            ],
          },
          {
            id: "sort",
            label: "Sort",
            value: sort,
            onChange: setSort,
            options: [
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
              { value: "relevance", label: "Most relevant" },
            ],
          },
        ]}
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading stories…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title="No stories match these filters"
          description="Try widening the date range or clearing a filter."
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((item) => (
            <Card key={item.id} className="gap-0 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {!item.is_read ? (
                      <span className="rounded-full bg-info/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-info uppercase">
                        Unread
                      </span>
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      {sourceName(item.source_id)} · {item.topic} ·{" "}
                      {formatDateTime(item.published_at)}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="max-w-3xl text-sm text-muted-foreground">{item.summary}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    Relevance {item.relevance_score}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelected(item);
                      if (!item.is_read) triage.mutate({ id: item.id, patch: { is_read: true } });
                    }}
                  >
                    Open
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="pr-6 text-left">{selected?.title}</DialogTitle>
            <DialogDescription className="text-left">
              {selected ? `${sourceName(selected.source_id)} · ${selected.topic}` : null}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-foreground">{selected?.summary}</p>
          {selected?.url ? (
            <a
              href={selected.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              Read the original <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : null}
          <DialogFooter className="flex-wrap gap-2 sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <ComingSoonButton explanation="Will draft a full post, carousel or reel script from this story using the newsroom's AI writer once that integration ships.">
                Generate AI content
              </ComingSoonButton>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!selected) return;
                  triage.mutate({ id: selected.id, patch: { status: "dismissed" } });
                  setSelected(null);
                }}
              >
                Dismiss
              </Button>
            </div>
            <Button
              size="sm"
              disabled={sendToStudio.isPending}
              onClick={() => selected && sendToStudio.mutate(selected)}
            >
              {sendToStudio.isPending ? "Creating draft…" : "Send to studio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
