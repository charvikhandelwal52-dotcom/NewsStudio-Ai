/**
 * MOCK SERVICES — DEMO DATA ONLY
 * ----------------------------------------------------------------------------
 * Everything in this file is fabricated in-memory. No network calls, no AI, no
 * scraping, no publishing. These functions exist so the newsroom screens can be
 * demonstrated end to end before the real integrations in
 * `src/services/integrations` are built.
 *
 * Nothing here should ever be mistaken for production behaviour: every export
 * is prefixed `mock` and every returned payload is labelled `isMock: true`.
 */

export type MockDelayOptions = { delayMs?: number };

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* -------------------------------------------------------------------------- */
/* Mock analytics — powers the Analytics screen                                */
/* -------------------------------------------------------------------------- */

export type MockTrendPoint = { label: string; reach: number; engagement: number };
export type MockTopicShare = { topic: string; posts: number; engagement: number };
export type MockCadencePoint = { day: string; posts: number };

const TREND_LABELS = ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6", "Wk 7", "Wk 8"];

export function mockReachTrend(): MockTrendPoint[] {
  const base = [18400, 21200, 19800, 26500, 31100, 28700, 35200, 41800];
  return TREND_LABELS.map((label, index) => ({
    label,
    reach: base[index] ?? 0,
    engagement: Math.round((base[index] ?? 0) * (0.07 + (index % 3) * 0.012)),
  }));
}

export function mockTopicPerformance(): MockTopicShare[] {
  return [
    { topic: "Technology", posts: 14, engagement: 9120 },
    { topic: "Sports", posts: 11, engagement: 8430 },
    { topic: "Business", posts: 9, engagement: 5210 },
    { topic: "Science", posts: 7, engagement: 4780 },
    { topic: "Politics", posts: 5, engagement: 2960 },
  ];
}

export function mockPostingCadence(): MockCadencePoint[] {
  return [
    { day: "Mon", posts: 3 },
    { day: "Tue", posts: 5 },
    { day: "Wed", posts: 4 },
    { day: "Thu", posts: 6 },
    { day: "Fri", posts: 5 },
    { day: "Sat", posts: 2 },
    { day: "Sun", posts: 1 },
  ];
}

export function mockAudienceSummary() {
  return {
    isMock: true as const,
    followers: 128_400,
    followerChangePct: 4.8,
    avgEngagementRatePct: 6.3,
    engagementChangePct: 1.1,
    bestPostingHour: "18:00–19:00",
    topLocation: "Bengaluru, IN",
  };
}

/* -------------------------------------------------------------------------- */
/* Mock scraping feed — what a real fetch WOULD return                         */
/* -------------------------------------------------------------------------- */

export type MockScrapedArticle = {
  isMock: true;
  title: string;
  summary: string;
  url: string;
  topic: string;
  publishedAt: string;
};

const MOCK_HEADLINES: Array<Omit<MockScrapedArticle, "isMock" | "publishedAt">> = [
  {
    title: "Regulator opens consultation on autonomous delivery fleets",
    summary: "Draft rules would cap fleet size per city block and require live telemetry sharing.",
    url: "https://example.com/autonomous-delivery",
    topic: "Technology",
  },
  {
    title: "Monsoon arrives nine days early along the western coast",
    summary: "Meteorologists call it the earliest onset recorded in eighteen years.",
    url: "https://example.com/monsoon-onset",
    topic: "World",
  },
  {
    title: "Domestic airline orders 60 narrow-body aircraft",
    summary: "The order is the carrier's largest and targets tier-two route expansion.",
    url: "https://example.com/airline-order",
    topic: "Business",
  },
];

/** Pretends to poll a source. Returns fabricated articles after a short delay. */
export async function mockFetchSourceFeed(
  sourceName: string,
  options: MockDelayOptions = {},
): Promise<MockScrapedArticle[]> {
  await wait(options.delayMs ?? 600);
  return MOCK_HEADLINES.map((article, index) => ({
    ...article,
    isMock: true as const,
    title: `${article.title}`,
    summary: `${article.summary} (sample item from ${sourceName})`,
    publishedAt: new Date(Date.now() - index * 3_600_000).toISOString(),
  }));
}

/* -------------------------------------------------------------------------- */
/* Mock activity feed — powers the dashboard timeline                          */
/* -------------------------------------------------------------------------- */

export type MockActivity = {
  isMock: true;
  id: string;
  actor: string;
  action: string;
  target: string;
  at: string;
};

export function mockRecentActivity(): MockActivity[] {
  const now = Date.now();
  const entries: Array<[string, string, string, number]> = [
    ["Priya Nair", "approved", "Rate hikes are on pause", 40],
    ["Arjun Mehta", "scheduled", "New campaign spending rules", 180],
    ["Priya Nair", "requested changes on", "New campaign spending rules", 320],
    ["Newsroom bot", "imported 8 stories from", "Reuters World", 480],
    ["Arjun Mehta", "published", "Record transfer, teenage striker", 1440],
  ];
  return entries.map(([actor, action, target, minutesAgo], index) => ({
    isMock: true as const,
    id: `activity-${index}`,
    actor,
    action,
    target,
    at: new Date(now - minutesAgo * 60_000).toISOString(),
  }));
}
