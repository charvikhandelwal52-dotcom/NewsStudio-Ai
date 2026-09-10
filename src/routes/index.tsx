import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, CalendarDays, Inbox, Newspaper, PenSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NewsPilot AI — newsroom workspace with human approval" },
      {
        name: "description",
        content:
          "Collect news, draft posts, approve them with a human sign-off, schedule and track performance — all in one newsroom workspace.",
      },
      { property: "og:title", content: "NewsPilot AI — newsroom workspace with human approval" },
      {
        property: "og:description",
        content:
          "Collect news, draft posts, approve them with a human sign-off, schedule and track performance.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Inbox,
    title: "News inbox",
    text: "Every story your sources bring in, filtered by category, source and date.",
  },
  {
    icon: PenSquare,
    title: "Content studio",
    text: "Write single posts, carousels and reel scripts with a live preview.",
  },
  {
    icon: CheckCircle2,
    title: "Human approval",
    text: "Nothing can be scheduled or published until a person approves it.",
  },
  {
    icon: CalendarDays,
    title: "Calendar and analytics",
    text: "Plan what goes out and see how it performed afterwards.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-primary/10 p-2 text-primary">
            <Newspaper className="size-4" aria-hidden />
          </span>
          <span className="font-headline text-lg text-foreground">NewsPilot AI</span>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-20">
        <section className="py-14 text-center">
          <h1 className="font-headline text-4xl text-foreground sm:text-5xl">
            The newsroom workspace with a human in the loop
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Bring stories in, shape them into posts, and let a person sign off before anything
            reaches your audience.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild>
              <Link to="/auth">Get started</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/auth">I already have an account</Link>
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="gap-0 p-5">
              <span className="inline-flex w-fit rounded-md bg-muted p-2 text-muted-foreground">
                <feature.icon className="size-4" aria-hidden />
              </span>
              <h2 className="mt-3 font-headline text-lg text-foreground">{feature.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{feature.text}</p>
            </Card>
          ))}
        </section>
      </main>
    </div>
  );
}
