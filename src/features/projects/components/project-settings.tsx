"use client";

import { useState } from "react";
import {
  XIcon,
  PlusIcon,
  Trash2Icon,
  LinkIcon,
  UploadIcon,
  GlobeIcon,
  TagIcon,
  UsersIcon,
  ImageIcon,
  ExternalLinkIcon,
  CopyIcon,
  CheckIcon,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useUpdateProjectGithubUrl,
  useUpdateProjectImageUrl,
  useUpdateProjectTags,
  useUpdateProjectPublished,
  useAddProjectLink,
  useDeleteProjectLink,
  useInviteCollaborator,
  useRemoveCollaborator,
} from "@/trpc/hooks/use-projects";

interface ProjectLink {
  id: string;
  label: string;
  url: string;
  order: number;
}

interface Collaborator {
  id: string;
  role: string;
  user: {
    id: string;
    username: string;
    name?: string | null;
    imageUrl?: string | null;
  };
}

interface ProjectSettingsProps {
  project: {
    id: string;
    username: string;
    slug: string;
    githubUrl?: string | null;
    imageUrl?: string | null;
    tags: string[];
    published: boolean;
    links: ProjectLink[];
    collaborators: Collaborator[];
  };
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 px-1">
        <Icon className="size-3 text-muted-foreground" />
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground/80">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

// ─── GitHub URL ───────────────────────────────────────────────────────────────

function GithubUrlField({
  projectId,
  value,
}: {
  projectId: string;
  value?: string | null;
}) {
  const [draft, setDraft] = useState(value ?? "");
  const [dirty, setDirty] = useState(false);
  const update = useUpdateProjectGithubUrl(projectId);

  const commit = () => {
    if (!dirty) return;
    update.mutate({ id: projectId, githubUrl: draft || null });
    setDirty(false);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Input
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setDirty(true);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
        className="text-[13px] h-8 bg-muted/40 border-border/60 focus-visible:ring-0"
        placeholder="https://github.com/user/repo"
      />
      {draft && (
        <a
          href={draft}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <ExternalLinkIcon className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
        </a>
      )}
    </div>
  );
}

// ─── Image URL ────────────────────────────────────────────────────────────────

function ImageUrlField({
  projectId,
  value,
}: {
  projectId: string;
  value?: string | null;
}) {
  const [tab, setTab] = useState<"url" | "upload">("url");
  const [draft, setDraft] = useState(value ?? "");
  const [dirty, setDirty] = useState(false);
  const update = useUpdateProjectImageUrl(projectId);

  const commit = () => {
    if (!dirty) return;
    update.mutate({ id: projectId, imageUrl: draft || null });
    setDirty(false);
  };

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "url" | "upload")}>
      <TabsList className="h-7 w-full bg-muted/40 border border-border/60 p-0.5 gap-0.5">
        <TabsTrigger
          value="url"
          className="flex-1 h-6 text-[11px] data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm"
        >
          <GlobeIcon className="size-3 mr-1" /> URL
        </TabsTrigger>
        <TabsTrigger
          value="upload"
          className="flex-1 h-6 text-[11px] data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm"
        >
          <UploadIcon className="size-3 mr-1" /> Upload
        </TabsTrigger>
      </TabsList>
      <TabsContent value="url" className="mt-1.5">
        <div className="flex items-center gap-1.5">
          <Input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setDirty(true);
            }}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
            }}
            className="text-[13px] h-8 bg-muted/40 border-border/60 focus-visible:ring-0"
            placeholder="https://..."
          />
          {draft && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draft}
              alt="preview"
              className="size-8 rounded-md border border-border/60 object-cover shrink-0"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
        </div>
      </TabsContent>
      <TabsContent value="upload" className="mt-1.5">
        <div className="flex items-center justify-center h-16 border border-dashed border-border/60 rounded-md bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <UploadIcon className="size-4" />
            <span className="text-[11px]">Upload coming soon</span>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

function TagsField({
  projectId,
  tags = [],
}: {
  projectId: string;
  tags: string[];
}) {
  const [input, setInput] = useState("");
  const update = useUpdateProjectTags(projectId);

  const addTag = () => {
    const tag = input.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || tags.includes(tag)) return;
    update.mutate({ id: projectId, tags: [...tags, tag] });
    setInput("");
  };

  const removeTag = (tag: string) => {
    update.mutate({ id: projectId, tags: tags.filter((t) => t !== tag) });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-6">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="text-[11px] gap-1 pr-1 h-5"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:text-destructive transition-colors"
            >
              <XIcon className="size-2.5" />
            </button>
          </Badge>
        ))}
        {tags.length === 0 && (
          <p className="text-[12px] text-muted-foreground/50">No tags yet</p>
        )}
      </div>
      <div className="flex gap-1.5">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          className="text-[13px] h-7 bg-muted/40 border-border/60 focus-visible:ring-0"
          placeholder="Add tag, press Enter"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0 shrink-0"
          onClick={addTag}
          disabled={!input.trim()}
        >
          <PlusIcon className="size-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── Project Links ────────────────────────────────────────────────────────────

function ProjectLinksField({
  projectId,
  links,
}: {
  projectId: string;
  links: ProjectLink[];
}) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const addLink = useAddProjectLink(projectId);
  const deleteLink = useDeleteProjectLink(projectId);

  const handleAdd = () => {
    if (!label.trim() || !url.trim()) return;
    addLink.mutate(
      { projectId, label: label.trim(), url: url.trim() },
      {
        onSuccess: () => {
          setLabel("");
          setUrl("");
        },
      },
    );
  };

  return (
    <div className="space-y-2">
      {links.length > 0 && (
        <div className="space-y-1">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-muted/40 group"
            >
              <LinkIcon className="size-3 text-muted-foreground/60 shrink-0" />
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-foreground flex-1 truncate hover:underline"
              >
                {link.label}
              </a>
              <button
                onClick={() => deleteLink.mutate({ id: link.id })}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-destructive"
              >
                <Trash2Icon className="size-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-1.5">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="text-[13px] h-7 bg-muted/40 border-border/60 focus-visible:ring-0"
          placeholder="Label (e.g. Live Demo)"
        />
        <div className="flex gap-1.5">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            className="text-[13px] h-7 bg-muted/40 border-border/60 focus-visible:ring-0"
            placeholder="https://..."
          />
          <Button
            size="sm"
            variant="outline"
            className="h-7 w-7 p-0 shrink-0"
            onClick={handleAdd}
            disabled={!label.trim() || !url.trim() || addLink.isPending}
          >
            <PlusIcon className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Collaborators ────────────────────────────────────────────────────────────

function CollaboratorsField({
  projectId,
  collaborators,
}: {
  projectId: string;
  collaborators: Collaborator[];
}) {
  const [input, setInput] = useState("");
  const invite = useInviteCollaborator(projectId);
  const remove = useRemoveCollaborator(projectId);

  const handleInvite = () => {
    if (!input.trim()) return;
    invite.mutate(
      { projectId, username: input.trim() },
      { onSuccess: () => setInput("") },
    );
  };

  return (
    <div className="space-y-2">
      {collaborators.length > 0 && (
        <div className="space-y-1">
          {collaborators.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/40 group"
            >
              <div className="size-5 rounded-full overflow-hidden bg-muted border border-border/60 shrink-0">
                {c.user.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.user.imageUrl}
                    alt={c.user.name ?? c.user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                    {(c.user.name ?? c.user.username).slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-foreground truncate">
                  {c.user.name ?? c.user.username}
                </p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  {c.role.toLowerCase()}
                </p>
              </div>
              {c.role !== "OWNER" && (
                <button
                  onClick={() => remove.mutate({ collaboratorId: c.id })}
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-destructive"
                >
                  <Trash2Icon className="size-3 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-1.5">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleInvite();
          }}
          className="text-[13px] h-7 bg-muted/40 border-border/60 focus-visible:ring-0"
          placeholder="Username to invite"
        />
        <Button
          size="sm"
          variant="outline"
          className="h-7 w-7 p-0 shrink-0"
          onClick={handleInvite}
          disabled={!input.trim() || invite.isPending}
        >
          <PlusIcon className="size-3" />
        </Button>
      </div>
      {invite.isError && (
        <p className="text-[11px] text-destructive">
          User not found or already added.
        </p>
      )}
    </div>
  );
}

// ─── Published toggle ─────────────────────────────────────────────────────────

function PublishedToggle({
  projectId,
  published,
  username,
  slug,
}: {
  projectId: string;
  published: boolean;
  username: string;
  slug: string;
}) {
  const [copied, setCopied] = useState(false);
  const update = useUpdateProjectPublished(projectId);

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "");
  const publicUrl = `${appUrl}/${username}/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/40">
        <div>
          <Label className="text-[13px] font-normal cursor-pointer">
            {published ? "Published" : "Draft"}
          </Label>
          <p className="text-[11px] text-muted-foreground">
            {published
              ? "Visible to anyone with the link"
              : "Only visible to you"}
          </p>
        </div>
        <Switch
          checked={published}
          onCheckedChange={(checked) =>
            update.mutate({ id: projectId, published: checked })
          }
        />
      </div>

      {published && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-muted/20 border border-border/40">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-primary hover:underline truncate flex-1"
          >
            {publicUrl}
          </a>
          <button
            onClick={handleCopy}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            title="Copy link"
          >
            {copied ? (
              <CheckIcon className="size-3.5 text-green-500" />
            ) : (
              <CopyIcon className="size-3.5" />
            )}
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLinkIcon className="size-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function ProjectSettings({ project }: ProjectSettingsProps) {
  return (
    <div className="space-y-5 p-3">
      <SettingsSection icon={GlobeIcon} title="Visibility">
        <PublishedToggle
          projectId={project.id}
          published={project.published}
          username={project.username}
          slug={project.slug}
        />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={FaGithub} title="GitHub">
        <GithubUrlField projectId={project.id} value={project.githubUrl} />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={ImageIcon} title="Project Image">
        <ImageUrlField projectId={project.id} value={project.imageUrl} />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={TagIcon} title="Tags">
        <TagsField projectId={project.id} tags={project.tags} />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={LinkIcon} title="Links">
        <ProjectLinksField projectId={project.id} links={project.links} />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={UsersIcon} title="Collaborators">
        <CollaboratorsField
          projectId={project.id}
          collaborators={project.collaborators}
        />
      </SettingsSection>
    </div>
  );
}
