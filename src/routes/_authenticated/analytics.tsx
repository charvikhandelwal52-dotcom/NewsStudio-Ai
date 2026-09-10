import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Bookmark,
  Eye,
  Heart,
  MessageCircle,
  Percent,
  PlayCircle,
  Share2,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Card } from "@/components/ui/card";
import { analyticsQuery, postsQuery } from "@/lib/newsroom";
import { mockPostingCadence, mockReachTrend, mockTopicPerformance } from "@/services/mock";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — NewsPilot AI" },
      { name: "description", content: "Sample reach, engagement and cadence charts for the newsroom." },
      { property: "og:title", content: "Analytics — NewsPilot AI" },
      {
        property: "og:description",
        content: "Sample reach, engagement and cadence charts for the newsroom.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const PIE_COLORS = ["var(--primary)", "var(--info)", "var(--success)", "var(--warning)", "var(--muted-foreground)"];

function AnalyticsPage() {
  const { data: snapshots = [] } = useQuery(analyticsQuery);
  const { data: posts = [] } = useQuery(postsQuery);

  const totals = snapshots.reduce(
    (acc, row) => ({
      reach: acc.reach + row.reach,
      likes: acc.likes + row.likes,
      comments: acc.comments + row.comments,
      saves: acc.saves + row.saves,
      shares: acc.shares + row.shares,
    }),
    { reach: 0, likes: 0, comments: 0, saves: 0, shares: 0 },
  );
  const impressions = Math.round(totals.reach * 1.42);
  const reelViews = Math.round(totals.reach * 0.38);
  const interactions = totals.likes + totals.comments + totals.saves + totals.shares;
  const engagementRate = totals.reach ? ((interactions / totals.reach) * 100).toFixed(1) : "0.0";

  const byType = ["post", "carousel", "reel"].map((format) => {
    const ids = posts.filter((post) => post.format === format).map((post) => post.id);
    const rows = snapshots.filter((row) => row.post_id && ids.includes(row.post_id));
    return {
      type: format,
      reach: rows.reduce((sum, row) => sum + row.reach, 0),
      engagement: rows.reduce(
        (sum, row) => sum + row.likes + row.comments + row.saves + row.shares,
        0,
      ),
    };
  });

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Sample newsroom performance. Real numbers arrive with the Instagram connection."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Reach" value={totals.reach.toLocaleString()} icon={Users} tone="primary" />
        <StatCard label="Impressions" value={impressions.toLocaleString()} icon={Eye} tone="info" />
        <StatCard label="Likes" value={totals.likes.toLocaleString()} icon={Heart} />
        <StatCard label="Comments" value={totals.comments.toLocaleString()} icon={MessageCircle} />
        <StatCard label="Shares" value={totals.shares.toLocaleString()} icon={Share2} />
        <StatCard label="Saves" value={totals.saves.toLocaleString()} icon={Bookmark} />
        <StatCard label="Reel views" value={reelViews.toLocaleString()} icon={PlayCircle} />
        <StatCard
          label="Engagement rate"
          value={`${engagementRate}%`}
          icon={Percent}
          tone="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-headline text-lg text-foreground">Performance over time</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockReachTrend()}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="reach" stroke="var(--primary)" strokeWidth={2} />
                <Line type="monotone" dataKey="engagement" stroke="var(--info)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-headline text-lg text-foreground">By content type</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byType}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="type" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip />
                <Bar dataKey="reach" fill="var(--primary)" radius={4} />
                <Bar dataKey="engagement" fill="var(--info)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-headline text-lg text-foreground">By category</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockTopicPerformance()}
                  dataKey="engagement"
                  nameKey="topic"
                  outerRadius={90}
                  label
                >
                  {mockTopicPerformance().map((entry, index) => (
                    <Cell key={entry.topic} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-headline text-lg text-foreground">Posting cadence</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockPostingCadence()}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip />
                <Bar dataKey="posts" fill="var(--success)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  );
}
