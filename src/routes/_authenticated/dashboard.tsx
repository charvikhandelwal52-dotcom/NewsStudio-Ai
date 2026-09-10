import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  CalendarClock,
  CheckCircle2,
  FileText,
  Inbox,
  Send,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  formatDateTime,
  formatRelative,
  newsItemsQuery,
  postsQuery,
} from "@/lib/newsroom";
import { mockRecentActivity } from "@/services/mock";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Newsroom dashboard — NewsPilot AI" },
      {
        name: "description",
        content: "Track incoming stories, drafts, approvals and scheduled posts at a glance.",
      },
      { property: "og:title", content: "Newsroom dashboard — NewsPilot AI" },
      {
        property: "og:description",
        content: "Track incoming stories, drafts, approvals and scheduled posts at a glance.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: posts = [] } = useQuery(postsQuery);
  const { data: news = [] } = useQuery(newsItemsQuery);
  const activity = mockRecentActivity();

  const count = (status: string) => posts.filter((post) => post.status === status).length;
  const pendingNews = news.filter((item) => item.status === "new").length;
  const pendingApprovals = posts.filter((post) => post.status === "in_review");
  const upcoming = posts
    .filter((post) => post.status === "scheduled" && post.scheduled_at)
    .sort((a, b) => Date.parse(a.scheduled_at!) - Date.parse(b.scheduled_at!))
    .slice(0, 5);
  const recentNews = news.slice(0, 5);

  return (
    <>
      <PageHeader
        title="Newsroom dashboard"
        description="Where every story stands today — from inbox to published."
        actions={
          <Button asChild size="sm">
            <Link to="/studio">Open Content Studio</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="New stories" value={pendingNews} icon={Inbox} tone="info" />
        <StatCard label="Drafts" value={count("draft")} icon={FileText} />
        <StatCard
          label="Awaiting approval"
          value={pendingApprovals.length}
          icon={CheckCircle2}
          tone="warning"
        />
        <StatCard label="Scheduled" value={count("scheduled")} icon={CalendarClock} tone="primary" />
        <StatCard label="Published" value={count("published")} icon={Send} tone="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-lg text-foreground">Recent news</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/inbox">View inbox</Link>
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {recentNews.length === 0 ? (
              <li className="text-sm text-muted-foreground">No stories yet.</li>
            ) : (
              recentNews.map((item) => (
                <li key={item.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.topic} · {formatRelative(item.published_at)}
                  </p>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-lg text-foreground">Pending approvals</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/approvals">Review queue</Link>
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {pendingApprovals.length === 0 ? (
              <li className="text-sm text-muted-foreground">Nothing is waiting on a reviewer.</li>
            ) : (
              pendingApprovals.slice(0, 5).map((post) => (
                <li
                  key={post.id}
                  className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{post.headline}</p>
                    <p className="text-xs text-muted-foreground">
                      {post.author_label} · {formatRelative(post.updated_at)}
                    </p>
                  </div>
                  <StatusBadge status={post.status} />
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-lg text-foreground">Upcoming posts</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/calendar">Open calendar</Link>
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {upcoming.length === 0 ? (
              <li className="text-sm text-muted-foreground">Nothing scheduled yet.</li>
            ) : (
              upcoming.map((post) => (
                <li
                  key={post.id}
                  className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{post.headline}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {post.channel} · {post.format}
                    </p>
                  </div>
                  <span className="text-xs whitespace-nowrap text-muted-foreground">
                    {formatDateTime(post.scheduled_at)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
            <h2 className="font-headline text-lg text-foreground">Recent activity</h2>
            <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
              Sample
            </span>
          </div>
          <ul className="mt-4 space-y-3">
            {activity.map((entry) => (
              <li key={entry.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                <p className="text-sm text-foreground">
                  <span className="font-medium">{entry.actor}</span> {entry.action}{" "}
                  <span className="font-medium">{entry.target}</span>
                </p>
                <p className="text-xs text-muted-foreground">{formatRelative(entry.at)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
