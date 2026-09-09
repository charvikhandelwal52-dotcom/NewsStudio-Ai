# NewsPilot AI — Build Plan

An AI-assisted newsroom workspace where editors review incoming news, draft content, approve it through a required human sign-off, schedule it, and track what went out.

## What gets built

**Sign in and accounts**
- Email/password sign-in plus Google sign-in, powered by Lovable Cloud.
- Two roles: admin and editor. Roles are stored separately from profiles so they can't be tampered with.
- Everything except the sign-in page and a small public landing page requires an account.

**Main screens**
1. **Dashboard** — newsroom overview: counts of pending items, drafts, awaiting approval, scheduled, published; recent activity list.
2. **News Inbox** — incoming stories from configured sources, with filters (source, topic, date, status), read/unread, and "Send to Studio".
3. **Content Studio** — write and edit a post: headline, body, hashtags, image slot, topic tags. Buttons for AI drafting and reel creation are visible but marked **Coming Soon**.
4. **Approval Center** — queue of items awaiting review. An item cannot reach Scheduled or Published without an explicit human approve action. Approve / request changes / reject, each with a comment, and a full approval history trail per item.
5. **Calendar** — month and week view of scheduled posts; drag-free scheduling via a date/time picker, reschedule and unschedule.
6. **Published** — everything that went out, with time, channel and mock performance snapshot.
7. **Analytics** — clearly-labelled sample charts: reach, engagement, top topics, posting cadence.
8. **Sources** — add, edit, enable/disable and delete news sources (name, URL, type, topics, fetch frequency).
9. **Settings** — profile, workspace preferences, notification toggles, role management for admins.

**Rules enforced**
- Approval is mandatory: the status flow is draft → in review → approved → scheduled → published, and nothing skips the approval step.
- Every approval decision is recorded with who, when, decision and comment.
- No button is dead. Anything that would need real scraping, AI generation, reel rendering, or Instagram publishing is rendered as a clearly badged "Coming Soon" control that explains what it will do.

## Technical section

**Data (Lovable Cloud / Postgres)**
- `profiles` (id → auth.users, display name, avatar, workspace prefs)
- `user_roles` (user_id, role enum: admin | editor) + `has_role()` security-definer function
- `sources` (name, url, type, topics[], frequency, enabled, created_by)
- `news_items` (source_id, title, summary, url, topic, published_at, status: new|triaged|dismissed, is_read)
- `content_posts` (news_item_id nullable, headline, body, hashtags[], image_url, topics[], status enum, scheduled_at, published_at, author_id)
- `approvals` (post_id, actor_id, decision enum: approved|changes_requested|rejected, comment, created_at)
- `analytics_snapshots` (post_id, reach, likes, comments, saves, captured_at) — mock data seeded by migration

Every table: explicit GRANTs, RLS enabled, policies scoped to the signed-in user's workspace role. Admins get full access via `has_role`; editors read all and write their own plus approvals.

Seed data (sources, news items, posts across every status, approval history, analytics rows) ships as literal INSERTs in the migration so the app is populated on first load.

**App structure (TanStack Start)**
- Public: `/` landing, `/auth`.
- Gated under `_authenticated/`: `/dashboard`, `/inbox`, `/studio`, `/studio/$postId`, `/approvals`, `/calendar`, `/published`, `/analytics`, `/sources`, `/settings`.
- Shared app shell: sidebar nav, top bar with search, role badge, account menu with sign-out.
- Data access through server functions with the auth middleware; TanStack Query for reads.

**Mock and future-integration layer**
- `src/services/mock/` — scraping feed, AI drafting, reel generation, Instagram publishing: each returns realistic shaped data, clearly commented as mock, no network calls.
- `src/services/integrations/` — TypeScript interfaces (`ScraperService`, `AIWriterService`, `ReelService`, `PublisherService`) documenting the real contracts to implement later, with `NotImplemented` stubs.

**UI components**
Reusable: `StatCard`, `StatusBadge`, `PageHeader`, `EmptyState`, `DataTable`, `FilterBar`, `ComingSoonButton`, `ApprovalTimeline`, `ScheduleDialog`, `ConfirmDialog`.

**Design**
Dense, calm newsroom aesthetic — dark-capable neutral palette with a single strong accent, tabular data, generous use of status colour, no gradients. All colours as design tokens.

## Out of scope (explicitly not implemented)
Real scraping, real AI generation, real reel rendering, real Instagram publishing.
