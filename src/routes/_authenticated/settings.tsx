import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Instagram } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ComingSoonButton } from "@/components/app/ComingSoonButton";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import { profilesQuery, rolesQuery, setUserRole, updateProfile, type AppRole } from "@/lib/newsroom";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — NewsPilot AI" },
      { name: "description", content: "Brand, content defaults, AI configuration and team roles." },
      { property: "og:title", content: "Settings — NewsPilot AI" },
      {
        property: "og:description",
        content: "Brand, content defaults, AI configuration and team roles.",
      },
    ],
  }),
  component: SettingsPage,
});

type Workspace = {
  brandName: string;
  logoUrl: string;
  description: string;
  hashtags: string;
  categories: string;
  captionStyle: string;
  aiProvider: string;
  aiModel: string;
};

const DEFAULT_WORKSPACE: Workspace = {
  brandName: "NewsPilot Newsroom",
  logoUrl: "",
  description: "Fast, verified news for a social-first audience.",
  hashtags: "#news #newsroom #breaking",
  categories: "Technology, Business, Sports, Science, Politics",
  captionStyle: "neutral",
  aiProvider: "lovable",
  aiModel: "google/gemini-3-flash",
};

const STORAGE_KEY = "newspilot.workspace";

const MODELS: Record<string, Array<{ value: string; label: string }>> = {
  lovable: [
    { value: "google/gemini-3-flash", label: "Gemini 3 Flash" },
    { value: "google/gemini-3-pro", label: "Gemini 3 Pro" },
    { value: "openai/gpt-5-mini", label: "GPT-5 Mini" },
  ],
  openai: [
    { value: "gpt-5", label: "GPT-5" },
    { value: "gpt-5-mini", label: "GPT-5 Mini" },
  ],
  anthropic: [{ value: "claude-sonnet", label: "Claude Sonnet" }],
};

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: profiles = [] } = useQuery(profilesQuery);
  const { data: roles = [] } = useQuery(rolesQuery);

  const [workspace, setWorkspace] = useState<Workspace>(DEFAULT_WORKSPACE);
  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setWorkspace({ ...DEFAULT_WORKSPACE, ...JSON.parse(stored) });
      } catch {
        /* ignore malformed local settings */
      }
    }
  }, []);

  useEffect(() => {
    if (!user?.profile) return;
    setDisplayName(user.profile.display_name);
    setJobTitle(user.profile.job_title);
  }, [user]);

  function saveWorkspace() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    toast.success("Workspace settings saved on this device.");
  }

  const saveProfile = useMutation({
    mutationFn: (patch: { display_name?: string; job_title?: string; notify_approvals?: boolean; notify_publishing?: boolean; notify_digest?: boolean }) =>
      updateProfile(user!.id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Profile updated.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const changeRole = useMutation({
    mutationFn: (input: { userId: string; role: AppRole }) => setUserRole(input.userId, input.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
      toast.success("Role updated.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const roleFor = (userId: string): AppRole =>
    roles.some((entry) => entry.user_id === userId && entry.role === "admin") ? "admin" : "editor";

  return (
    <>
      <PageHeader
        title="Settings"
        description="Brand, content defaults, AI configuration, your profile and team roles."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-headline text-lg text-foreground">Brand</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Account name</Label>
              <Input
                id="brand-name"
                value={workspace.brandName}
                onChange={(e) => setWorkspace({ ...workspace, brandName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-logo">Logo URL</Label>
              <Input
                id="brand-logo"
                value={workspace.logoUrl}
                onChange={(e) => setWorkspace({ ...workspace, logoUrl: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-description">Description</Label>
              <Textarea
                id="brand-description"
                rows={3}
                value={workspace.description}
                onChange={(e) => setWorkspace({ ...workspace, description: e.target.value })}
              />
            </div>
            <Button size="sm" onClick={saveWorkspace}>
              Save brand settings
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-headline text-lg text-foreground">Content defaults</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-hashtags">Default hashtags</Label>
              <Input
                id="default-hashtags"
                value={workspace.hashtags}
                onChange={(e) => setWorkspace({ ...workspace, hashtags: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default-categories">Default categories</Label>
              <Input
                id="default-categories"
                value={workspace.categories}
                onChange={(e) => setWorkspace({ ...workspace, categories: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caption-style">Caption style</Label>
              <Select
                value={workspace.captionStyle}
                onValueChange={(value) => setWorkspace({ ...workspace, captionStyle: value })}
              >
                <SelectTrigger id="caption-style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="neutral">Neutral newswire</SelectItem>
                  <SelectItem value="explainer">Explainer</SelectItem>
                  <SelectItem value="punchy">Punchy and short</SelectItem>
                  <SelectItem value="analytical">Analytical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={saveWorkspace}>
              Save content defaults
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-headline text-lg text-foreground">AI configuration</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose the writer that will draft content once AI generation ships. No keys are entered
            or shown here.
          </p>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-provider">Provider</Label>
              <Select
                value={workspace.aiProvider}
                onValueChange={(value) =>
                  setWorkspace({
                    ...workspace,
                    aiProvider: value,
                    aiModel: MODELS[value]?.[0]?.value ?? "",
                  })
                }
              >
                <SelectTrigger id="ai-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lovable">Built-in AI</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ai-model">Model</Label>
              <Select
                value={workspace.aiModel}
                onValueChange={(value) => setWorkspace({ ...workspace, aiModel: value })}
              >
                <SelectTrigger id="ai-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(MODELS[workspace.aiProvider] ?? []).map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" onClick={saveWorkspace}>
              Save AI configuration
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-muted p-2 text-muted-foreground">
              <Instagram className="size-4" aria-hidden />
            </span>
            <h2 className="font-headline text-lg text-foreground">Instagram connection</h2>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Status: <span className="font-medium text-foreground">Not connected</span>. Approved
            posts stay in the calendar until publishing is wired up.
          </p>
          <div className="mt-4">
            <ComingSoonButton explanation="Will connect your Instagram business account so approved posts, carousels and reels can be published automatically.">
              Connect Instagram
            </ComingSoonButton>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-headline text-lg text-foreground">Your profile</h2>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-title">Job title</Label>
              <Input
                id="job-title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              disabled={!user || saveProfile.isPending}
              onClick={() =>
                saveProfile.mutate({ display_name: displayName, job_title: jobTitle })
              }
            >
              Save profile
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-headline text-lg text-foreground">Notifications</h2>
          <div className="mt-4 space-y-4">
            {(
              [
                ["notify_approvals", "Something needs my approval"],
                ["notify_publishing", "A post goes out"],
                ["notify_digest", "Daily newsroom digest"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-4">
                <Label htmlFor={key}>{label}</Label>
                <Switch
                  id={key}
                  checked={Boolean(user?.profile?.[key])}
                  disabled={!user}
                  onCheckedChange={(checked) => saveProfile.mutate({ [key]: checked })}
                />
              </div>
            ))}
          </div>
        </Card>

        {user?.isAdmin ? (
          <Card className="p-5 lg:col-span-2">
            <h2 className="font-headline text-lg text-foreground">Team roles</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Admins manage sources and roles. Editors write and review content.
            </p>
            <ul className="mt-4 space-y-3">
              {profiles.map((profile) => (
                <li
                  key={profile.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{profile.display_name}</p>
                    <p className="text-xs text-muted-foreground">{profile.job_title}</p>
                  </div>
                  <Select
                    value={roleFor(profile.id)}
                    onValueChange={(value) =>
                      changeRole.mutate({ userId: profile.id, role: value as AppRole })
                    }
                  >
                    <SelectTrigger className="w-[140px]" aria-label={`Role for ${profile.display_name}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                    </SelectContent>
                  </Select>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </>
  );
}
