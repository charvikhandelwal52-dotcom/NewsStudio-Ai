/**
 * FUTURE INTEGRATION CONTRACTS
 * ----------------------------------------------------------------------------
 * These interfaces describe the real services NewsPilot AI will talk to once
 * the integrations are built. NOTHING here performs real work today — every
 * concrete implementation in this file throws `NotImplementedError`.
 *
 * The app never calls these stubs at runtime. UI that would depend on them is
 * rendered as a clearly badged "Coming soon" control instead. When a real
 * integration lands, implement the matching interface and swap it in behind the
 * same contract — no UI changes required.
 */

export class NotImplementedError extends Error {
  constructor(service: string, method: string) {
    super(`${service}.${method}() is not implemented yet. This is a planned integration.`);
    this.name = "NotImplementedError";
  }
}

/* -------------------------------------------------------------------------- */
/* Scraping                                                                    */
/* -------------------------------------------------------------------------- */

export interface ScrapedArticle {
  externalId: string;
  title: string;
  summary: string;
  url: string;
  imageUrl?: string;
  topic: string;
  publishedAt: string;
}

export interface ScraperService {
  /** Pull the latest articles for one configured source. */
  fetchSource(input: { sourceId: string; url: string; since?: string }): Promise<ScrapedArticle[]>;
  /** Validate that a URL is reachable and parseable before saving a source. */
  validateSource(input: { url: string }): Promise<{ valid: boolean; detectedType?: string }>;
}

export const scraperService: ScraperService = {
  fetchSource() {
    throw new NotImplementedError("ScraperService", "fetchSource");
  },
  validateSource() {
    throw new NotImplementedError("ScraperService", "validateSource");
  },
};

/* -------------------------------------------------------------------------- */
/* AI writing                                                                  */
/* -------------------------------------------------------------------------- */

export interface AIDraft {
  headline: string;
  body: string;
  hashtags: string[];
  toneNotes?: string;
}

export interface AIWriterService {
  /** Turn a news item into a social-ready draft. */
  draftFromNewsItem(input: {
    newsItemId: string;
    tone: "neutral" | "punchy" | "explainer";
    maxWords?: number;
  }): Promise<AIDraft>;
  /** Rewrite existing copy against an instruction. */
  rewrite(input: { body: string; instruction: string }): Promise<AIDraft>;
  /** Suggest hashtags for a body of copy. */
  suggestHashtags(input: { body: string; count: number }): Promise<string[]>;
}

export const aiWriterService: AIWriterService = {
  draftFromNewsItem() {
    throw new NotImplementedError("AIWriterService", "draftFromNewsItem");
  },
  rewrite() {
    throw new NotImplementedError("AIWriterService", "rewrite");
  },
  suggestHashtags() {
    throw new NotImplementedError("AIWriterService", "suggestHashtags");
  },
};

/* -------------------------------------------------------------------------- */
/* Reel generation                                                             */
/* -------------------------------------------------------------------------- */

export interface ReelJob {
  jobId: string;
  status: "queued" | "rendering" | "ready" | "failed";
  videoUrl?: string;
  durationSeconds?: number;
}

export interface ReelService {
  /** Kick off a render job for a post. */
  requestReel(input: {
    postId: string;
    script: string;
    voice: string;
    aspectRatio: "9:16" | "1:1";
  }): Promise<ReelJob>;
  /** Poll a render job. */
  getJob(input: { jobId: string }): Promise<ReelJob>;
}

export const reelService: ReelService = {
  requestReel() {
    throw new NotImplementedError("ReelService", "requestReel");
  },
  getJob() {
    throw new NotImplementedError("ReelService", "getJob");
  },
};

/* -------------------------------------------------------------------------- */
/* Publishing                                                                  */
/* -------------------------------------------------------------------------- */

export interface PublishResult {
  externalPostId: string;
  permalink: string;
  publishedAt: string;
}

export interface PublisherService {
  /** Publish an approved post to the connected channel. */
  publish(input: {
    postId: string;
    caption: string;
    mediaUrl: string;
    channel: "instagram";
  }): Promise<PublishResult>;
  /** Hand a post to the channel's own scheduler. */
  schedule(input: { postId: string; publishAt: string }): Promise<{ scheduled: true }>;
  /** Read back live performance metrics for a published post. */
  fetchInsights(input: { externalPostId: string }): Promise<{
    reach: number;
    likes: number;
    comments: number;
    saves: number;
    shares: number;
  }>;
}

export const publisherService: PublisherService = {
  publish() {
    throw new NotImplementedError("PublisherService", "publish");
  },
  schedule() {
    throw new NotImplementedError("PublisherService", "schedule");
  },
  fetchInsights() {
    throw new NotImplementedError("PublisherService", "fetchInsights");
  },
};
