import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PostStatus = Database["public"]["Enums"]["post_status"];
export type ApprovalDecision = Database["public"]["Enums"]["approval_decision"];
export type NewsItemStatus = Database["public"]["Enums"]["news_item_status"];
export type SourceType = Database["public"]["Enums"]["source_type"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export type Source = Database["public"]["Tables"]["sources"]["Row"];
export type NewsItem = Database["public"]["Tables"]["news_items"]["Row"];
export type ContentPost = Database["public"]["Tables"]["content_posts"]["Row"];
export type Approval = Database["public"]["Tables"]["approvals"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AnalyticsSnapshot = Database["public"]["Tables"]["analytics_snapshots"]["Row"];

export const POST_STATUSES: PostStatus[] = [
  "draft",
  "in_review",
  "approved",
  "scheduled",
  "published",
  "rejected",
];

export const STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  scheduled: "Scheduled",
  published: "Published",
  rejected: "Rejected",
};

export const DECISION_LABELS: Record<ApprovalDecision, string> = {
  approved: "Approved",
  changes_requested: "Changes requested",
  rejected: "Rejected",
};

function unwrap<T>(result: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (result.error) throw new Error(result.error.message);
  return result.data as NonNullable<T>;
}

/* --------------------------------- queries -------------------------------- */

export const sourcesQuery = queryOptions({
  queryKey: ["sources"],
  queryFn: async () =>
    unwrap(await supabase.from("sources").select("*").order("name", { ascending: true })),
});

export const newsItemsQuery = queryOptions({
  queryKey: ["news_items"],
  queryFn: async () =>
    unwrap(
      await supabase.from("news_items").select("*").order("published_at", { ascending: false }),
    ),
});

export const postsQuery = queryOptions({
  queryKey: ["content_posts"],
  queryFn: async () =>
    unwrap(
      await supabase.from("content_posts").select("*").order("updated_at", { ascending: false }),
    ),
});

export const approvalsQuery = queryOptions({
  queryKey: ["approvals"],
  queryFn: async () =>
    unwrap(await supabase.from("approvals").select("*").order("created_at", { ascending: false })),
});

export const analyticsQuery = queryOptions({
  queryKey: ["analytics_snapshots"],
  queryFn: async () =>
    unwrap(
      await supabase
        .from("analytics_snapshots")
        .select("*")
        .order("captured_at", { ascending: false }),
    ),
});

export const profilesQuery = queryOptions({
  queryKey: ["profiles"],
  queryFn: async () => unwrap(await supabase.from("profiles").select("*").order("display_name")),
});

export const rolesQuery = queryOptions({
  queryKey: ["user_roles"],
  queryFn: async () => unwrap(await supabase.from("user_roles").select("*")),
});

export function postQuery(postId: string) {
  return queryOptions({
    queryKey: ["content_posts", postId],
    queryFn: async () =>
      unwrap(await supabase.from("content_posts").select("*").eq("id", postId).maybeSingle()),
  });
}

export function postApprovalsQuery(postId: string) {
  return queryOptions({
    queryKey: ["approvals", postId],
    queryFn: async () =>
      unwrap(
        await supabase
          .from("approvals")
          .select("*")
          .eq("post_id", postId)
          .order("created_at", { ascending: false }),
      ),
  });
}

/* -------------------------------- mutations ------------------------------- */

export async function createPost(input: Partial<ContentPost> & { headline: string }) {
  const { data: auth } = await supabase.auth.getUser();
  return unwrap(
    await supabase
      .from("content_posts")
      .insert({
        ...input,
        author_id: auth.user?.id ?? null,
      })
      .select()
      .single(),
  );
}

export async function updatePost(postId: string, patch: Partial<ContentPost>) {
  return unwrap(
    await supabase.from("content_posts").update(patch).eq("id", postId).select().single(),
  );
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from("content_posts").delete().eq("id", postId);
  if (error) throw new Error(error.message);
}

export async function recordApproval(input: {
  postId: string;
  decision: ApprovalDecision;
  comment: string;
  actorLabel: string;
}) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("You need to be signed in to review a post.");

  unwrap(
    await supabase
      .from("approvals")
      .insert({
        post_id: input.postId,
        actor_id: auth.user.id,
        actor_label: input.actorLabel,
        decision: input.decision,
        comment: input.comment,
      })
      .select()
      .single(),
  );

  const nextStatus: PostStatus =
    input.decision === "approved"
      ? "approved"
      : input.decision === "rejected"
        ? "rejected"
        : "draft";

  return updatePost(input.postId, { status: nextStatus });
}

export async function upsertSource(input: Partial<Source> & { name: string; url: string }) {
  const { data: auth } = await supabase.auth.getUser();
  if (input.id) {
    const { id, ...patch } = input;
    return unwrap(await supabase.from("sources").update(patch).eq("id", id).select().single());
  }
  return unwrap(
    await supabase
      .from("sources")
      .insert({ ...input, created_by: auth.user?.id ?? null })
      .select()
      .single(),
  );
}

export async function deleteSource(sourceId: string) {
  const { error } = await supabase.from("sources").delete().eq("id", sourceId);
  if (error) throw new Error(error.message);
}

export async function setNewsItemStatus(
  itemId: string,
  patch: { status?: NewsItemStatus; is_read?: boolean },
) {
  return unwrap(await supabase.from("news_items").update(patch).eq("id", itemId).select().single());
}

export async function updateProfile(userId: string, patch: Partial<Profile>) {
  return unwrap(await supabase.from("profiles").update(patch).eq("id", userId).select().single());
}

export async function setUserRole(userId: string, role: AppRole) {
  const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId);
  if (deleteError) throw new Error(deleteError.message);
  return unwrap(
    await supabase.from("user_roles").insert({ user_id: userId, role }).select().single(),
  );
}

/* --------------------------------- helpers -------------------------------- */

/**
 * Mirrors the database rule: a post is only clear to schedule or publish when
 * its most recent review decision is an approval. The database enforces this
 * too — this helper exists so the UI can disable the control instead of letting
 * the user hit an error.
 */
export function isClearedForScheduling(post: ContentPost, approvals: Approval[]) {
  const forPost = approvals
    .filter((approval) => approval.post_id === post.id)
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  return forPost[0]?.decision === "approved";
}

export function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(value: string | null) {
  if (!value) return "—";
  const diffMs = Date.now() - Date.parse(value);
  const minutes = Math.round(diffMs / 60_000);
  if (Math.abs(minutes) < 60) return minutes <= 0 ? "just now" : `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function toLocalInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
