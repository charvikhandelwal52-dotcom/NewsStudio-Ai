import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/app/PageHeader";
import { ScheduleDialog } from "@/components/app/ScheduleDialog";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  approvalsQuery,
  isClearedForScheduling,
  postsQuery,
  updatePost,
  type ContentPost,
} from "@/lib/newsroom";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Content calendar — NewsPilot AI" },
      { name: "description", content: "See drafts, approved, scheduled and published posts by date." },
      { property: "og:title", content: "Content calendar — NewsPilot AI" },
      {
        property: "og:description",
        content: "See drafts, approved, scheduled and published posts by date.",
      },
    ],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const queryClient = useQueryClient();
  const { data: posts = [] } = useQuery(postsQuery);
  const { data: approvals = [] } = useQuery(approvalsQuery);
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");

  const schedule = useMutation({
    mutationFn: (input: { postId: string; at: string | null }) =>
      updatePost(input.postId, {
        scheduled_at: input.at,
        status: input.at ? "scheduled" : "approved",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content_posts"] });
      toast.success("Calendar updated.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const days = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(cursor, { weekStartsOn: 1 });
      return Array.from({ length: 7 }, (_, index) => addDays(start, index));
    }
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const list: Date[] = [];
    for (let day = start; day <= end; day = addDays(day, 1)) list.push(day);
    return list;
  }, [cursor, view]);

  const dated = posts.filter((post) => post.scheduled_at || post.published_at);
  const postsFor = (day: Date) =>
    dated.filter((post) => {
      const value = post.published_at ?? post.scheduled_at;
      return value ? isSameDay(new Date(value), day) : false;
    });

  const awaitingSchedule = posts.filter(
    (post) => post.status === "approved" && !post.scheduled_at,
  );

  const move = (direction: number) =>
    setCursor((prev) =>
      view === "month" ? addMonths(prev, direction) : addWeeks(prev, direction),
    );

  const tone: Record<ContentPost["status"], string> = {
    draft: "border-l-muted-foreground",
    in_review: "border-l-warning",
    approved: "border-l-success",
    scheduled: "border-l-info",
    published: "border-l-primary",
    rejected: "border-l-destructive",
  };

  return (
    <>
      <PageHeader
        title="Content calendar"
        description="Approved content can be scheduled here. Everything else is shown for context."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => move(-1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => move(1)}>
              Next
            </Button>
            <Button
              size="sm"
              variant={view === "month" ? "default" : "outline"}
              onClick={() => setView("month")}
            >
              Month
            </Button>
            <Button
              size="sm"
              variant={view === "week" ? "default" : "outline"}
              onClick={() => setView("week")}
            >
              Week
            </Button>
          </div>
        }
      />

      <h2 className="font-headline text-xl text-foreground">
        {view === "month"
          ? format(cursor, "MMMM yyyy")
          : `Week of ${format(startOfWeek(cursor, { weekStartsOn: 1 }), "d MMM yyyy")}`}
      </h2>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border bg-border text-sm">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => (
          <div key={label} className="bg-card px-2 py-1.5 text-xs font-medium text-muted-foreground">
            {label}
          </div>
        ))}
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "min-h-28 space-y-1 bg-card p-2 align-top",
              !isSameMonth(day, cursor) && view === "month" && "opacity-60",
            )}
          >
            <p
              className={cn(
                "text-xs tabular-nums",
                isSameDay(day, new Date())
                  ? "font-semibold text-primary"
                  : "text-muted-foreground",
              )}
            >
              {format(day, "d")}
            </p>
            {postsFor(day).map((post) => (
              <Link
                key={post.id}
                to="/studio/$postId"
                params={{ postId: post.id }}
                className={cn(
                  "block truncate rounded-sm border-l-2 bg-muted px-1.5 py-1 text-xs text-foreground hover:bg-accent",
                  tone[post.status],
                )}
                title={post.headline}
              >
                {format(new Date(post.published_at ?? post.scheduled_at!), "HH:mm")}{" "}
                {post.headline}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="font-headline text-lg text-foreground">Approved and waiting for a slot</h2>
        {awaitingSchedule.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing approved is unscheduled right now.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {awaitingSchedule.map((post) => (
              <li
                key={post.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{post.headline}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {post.channel} · {post.format}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={post.status} />
                  <ScheduleDialog
                    trigger={
                      <Button size="sm" disabled={!isClearedForScheduling(post, approvals)}>
                        Schedule
                      </Button>
                    }
                    initialValue={post.scheduled_at}
                    onSchedule={(iso) => schedule.mutate({ postId: post.id, at: iso })}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="font-headline text-lg text-foreground">Scheduled</h2>
        {posts.filter((post) => post.status === "scheduled").length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing scheduled yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {posts
              .filter((post) => post.status === "scheduled")
              .map((post) => (
                <li
                  key={post.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{post.headline}</p>
                    <p className="text-xs text-muted-foreground">
                      {post.scheduled_at
                        ? format(new Date(post.scheduled_at), "d MMM yyyy, HH:mm")
                        : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScheduleDialog
                      trigger={
                        <Button size="sm" variant="outline">
                          Reschedule
                        </Button>
                      }
                      initialValue={post.scheduled_at}
                      onSchedule={(iso) => schedule.mutate({ postId: post.id, at: iso })}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => schedule.mutate({ postId: post.id, at: null })}
                    >
                      Unschedule
                    </Button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </>
  );
}
