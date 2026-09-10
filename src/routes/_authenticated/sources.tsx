import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Rss, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { EmptyState } from "@/components/app/EmptyState";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  deleteSource,
  formatRelative,
  sourcesQuery,
  upsertSource,
  type Source,
  type SourceType,
} from "@/lib/newsroom";

export const Route = createFileRoute("/_authenticated/sources")({
  head: () => ({
    meta: [
      { title: "News sources — NewsPilot AI" },
      { name: "description", content: "Add, edit, pause or remove the feeds your newsroom watches." },
      { property: "og:title", content: "News sources — NewsPilot AI" },
      {
        property: "og:description",
        content: "Add, edit, pause or remove the feeds your newsroom watches.",
      },
    ],
  }),
  component: SourcesPage,
});

type Draft = {
  id?: string;
  name: string;
  url: string;
  type: SourceType;
  topics: string;
  fetch_frequency_minutes: number;
  enabled: boolean;
};

const EMPTY: Draft = {
  name: "",
  url: "",
  type: "rss",
  topics: "",
  fetch_frequency_minutes: 60,
  enabled: true,
};

function SourcesPage() {
  const queryClient = useQueryClient();
  const { data: sources = [] } = useQuery(sourcesQuery);
  const [draft, setDraft] = useState<Draft | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["sources"] });

  const save = useMutation({
    mutationFn: (input: Draft) =>
      upsertSource({
        ...(input.id ? { id: input.id } : {}),
        name: input.name,
        url: input.url,
        type: input.type,
        enabled: input.enabled,
        fetch_frequency_minutes: Number(input.fetch_frequency_minutes) || 60,
        topics: input.topics
          .split(",")
          .map((topic) => topic.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      invalidate();
      setDraft(null);
      toast.success("Source saved.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggle = useMutation({
    mutationFn: (source: Source) =>
      upsertSource({ id: source.id, name: source.name, url: source.url, enabled: !source.enabled }),
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteSource(id),
    onSuccess: () => {
      invalidate();
      toast.success("Source removed.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <PageHeader
        title="Sources"
        description="The feeds the newsroom watches. Only admins can change them."
        actions={
          <Button size="sm" onClick={() => setDraft(EMPTY)}>
            <Plus className="size-4" aria-hidden /> Add source
          </Button>
        }
      />

      {sources.length === 0 ? (
        <EmptyState
          icon={Rss}
          title="No sources yet"
          description="Add an RSS feed, API or website to start collecting stories."
          action={
            <Button size="sm" onClick={() => setDraft(EMPTY)}>
              Add source
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {sources.map((source) => (
            <Card key={source.id} className="gap-0 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{source.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {source.type.toUpperCase()} · {source.url} · every{" "}
                    {source.fetch_frequency_minutes} min · checked{" "}
                    {formatRelative(source.last_checked_at)}
                  </p>
                  {source.topics.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {source.topics.join(", ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={source.enabled}
                      onCheckedChange={() => toggle.mutate(source)}
                      aria-label={`Enable ${source.name}`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {source.enabled ? "Enabled" : "Paused"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setDraft({
                        id: source.id,
                        name: source.name,
                        url: source.url,
                        type: source.type,
                        topics: source.topics.join(", "),
                        fetch_frequency_minutes: source.fetch_frequency_minutes,
                        enabled: source.enabled,
                      })
                    }
                  >
                    Edit
                  </Button>
                  <ConfirmDialog
                    trigger={
                      <Button size="sm" variant="ghost" className="text-destructive">
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    }
                    title={`Delete ${source.name}?`}
                    description="Stories already collected stay in the inbox, but nothing new will arrive from this source."
                    confirmLabel="Delete"
                    destructive
                    onConfirm={() => remove.mutate(source.id)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit source" : "Add source"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="source-name">Name</Label>
                <Input
                  id="source-name"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source-url">URL</Label>
                <Input
                  id="source-url"
                  value={draft.url}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                  placeholder="https://example.com/feed.xml"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="source-type">Type</Label>
                  <Select
                    value={draft.type}
                    onValueChange={(value) => setDraft({ ...draft, type: value as SourceType })}
                  >
                    <SelectTrigger id="source-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rss">RSS</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source-frequency">Check every (minutes)</Label>
                  <Input
                    id="source-frequency"
                    type="number"
                    min={5}
                    value={draft.fetch_frequency_minutes}
                    onChange={(e) =>
                      setDraft({ ...draft, fetch_frequency_minutes: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source-topics">Categories (comma separated)</Label>
                <Input
                  id="source-topics"
                  value={draft.topics}
                  onChange={(e) => setDraft({ ...draft, topics: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="source-enabled"
                  checked={draft.enabled}
                  onCheckedChange={(checked) => setDraft({ ...draft, enabled: checked })}
                />
                <Label htmlFor="source-enabled">Enabled</Label>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              disabled={!draft?.name || !draft?.url || save.isPending}
              onClick={() => draft && save.mutate(draft)}
            >
              Save source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
