import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/app/EmptyState";
import { FilterBar } from "@/components/app/FilterBar";
import { PageHeader } from "@/components/app/PageHeader";
import { Card } from "@/components/ui/card";
import { analyticsQuery, formatDateTime, postsQuery } from "@/lib/newsroom";

export const Route = createFileRoute("/_authenticated/published")({
  head: () => ({
    meta: [
      { title: "Published posts — NewsPilot AI" },
      { name: "description", content: "Everything the newsroom has published, with sample metrics." },
      { property: "og:title", content: "Published posts — NewsPilot AI" },
      {
        property: "og:description",
        content: "Everything the newsroom has published, with sample metrics.",
      },
    ],
  }),
  component: PublishedPage,
});

const ALL = "all";

function PublishedPage() {
  const { data: posts = [] } = useQuery(postsQuery);
  const { data: snapshots = [] } = useQuery(analyticsQuery);
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState(ALL);
  const [formatFilter, setFormatFilter] = useState(ALL);

  const published = useMemo(
    () =>
      posts
        .filter((post) => post.status === "published")
        .filter((post) => {
          if (search && !post.headline.toLowerCase().includes(search.toLowerCase())) return false;
          if (channel !== ALL && post.channel !== channel) return false;
          if (formatFilter !== ALL && post.format !== formatFilter) return false;
          return true;
        })
        .sort((a, b) => Date.parse(b.published_at ?? "") - Date.parse(a.published_at ?? "")),
    [posts, search, channel, formatFilter],
  );

  const metricsFor = (postId: string) => {
    const rows = snapshots.filter((row) => row.post_id === postId);
    return rows.reduce(
      (acc, row) => ({
        reach: acc.reach + row.reach,
        likes: acc.likes + row.likes,
        comments: acc.comments + row.comments,
        saves: acc.saves + row.saves,
        shares: acc.shares + row.shares,
      }),
      { reach: 0, likes: 0, comments: 0, saves: 0, shares: 0 },
    );
  };

  return (
    <>
      <PageHeader
        title="Published"
        description="Everything that went out, with the sample performance numbers attached."
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search published posts…"
        filters={[
          {
            id: "channel",
            label: "Channel",
            value: channel,
            onChange: setChannel,
            options: [
              { value: ALL, label: "All channels" },
              { value: "instagram", label: "Instagram" },
              { value: "facebook", label: "Facebook" },
              { value: "x", label: "X" },
              { value: "linkedin", label: "LinkedIn" },
            ],
          },
          {
            id: "format",
            label: "Type",
            value: formatFilter,
            onChange: setFormatFilter,
            options: [
              { value: ALL, label: "All types" },
              { value: "post", label: "Single post" },
              { value: "carousel", label: "Carousel" },
              { value: "reel", label: "Reel" },
            ],
          },
        ]}
      />

      {published.length === 0 ? (
        <EmptyState
          icon={Send}
          title="Nothing published yet"
          description="Approved and scheduled posts appear here once they go out."
        />
      ) : (
        <div className="grid gap-3">
          {published.map((post) => {
            const metrics = metricsFor(post.id);
            return (
              <Card key={post.id} className="gap-0 p-4">
                <div className="grid gap-4 sm:grid-cols-[88px_minmax(0,1fr)]">
                  <div className="overflow-hidden rounded-md border border-border">
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.headline}
                        className="aspect-square w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-muted text-[10px] text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-2">
                    <h3 className="text-base font-semibold text-foreground">{post.headline}</h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {post.channel} · {post.format} · {formatDateTime(post.published_at)} · post ID{" "}
                      <span className="font-mono">{post.id.slice(0, 8)}</span>
                    </p>
                    <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                      {Object.entries(metrics).map(([label, value]) => (
                        <div key={label} className="flex gap-1">
                          <dt className="capitalize">{label}</dt>
                          <dd className="font-medium text-foreground tabular-nums">
                            {value.toLocaleString()}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Performance numbers shown here are sample data until the Instagram connection is built.
      </p>
    </>
  );
}
