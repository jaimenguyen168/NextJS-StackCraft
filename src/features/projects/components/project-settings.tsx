"use client";

import React, { useState, useEffect } from "react";
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
  Loader2Icon,
  TriangleAlertIcon,
  RefreshCwIcon,
  RefreshCwOffIcon,
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
  useUpdateProjectLogoUrl,
  useUpdateProjectTags,
  useUpdateProjectPublished,
  useAddProjectLink,
  useDeleteProjectLink,
  useAddProjectImage,
  useDeleteProjectImage,
  useProject,
} from "@/trpc/hooks/use-projects";
import { useProjectSnapshot } from "@/features/projects/contexts/project-snapshot-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectDeleteDialog } from "@/features/projects/components/project-delete-dialog";
import { CollaboratorsField } from "@/features/projects/components/collaborators-field";
import { toast } from "sonner";

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

// ─── GitHub URL + Webhook ─────────────────────────────────────────────────────

function GithubUrlField({ value }: { value?: string | null }) {
  const { projectId } = useProjectSnapshot();
  const [draft, setDraft] = useState(value ?? "");
  const [webhookRegistered, setWebhookRegistered] = useState<boolean | null>(
    null,
  );
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [checkingWebhook, setCheckingWebhook] = useState(false);
  const update = useUpdateProjectGithubUrl(projectId);

  const isDirty = draft !== (value ?? "");

  // Check webhook status on mount if there's a saved URL
  useEffect(() => {
    if (!value) return;
    setCheckingWebhook(true);
    fetch(`/api/webhooks/github/setup?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data) => setWebhookRegistered(data.registered ?? false))
      .catch(() => setWebhookRegistered(false))
      .finally(() => setCheckingWebhook(false));
  }, [projectId, value]);

  const commit = () => {
    update.mutate({ id: projectId, githubUrl: draft || null });
  };

  const handleWebhookToggle = async () => {
    const action = webhookRegistered ? "remove" : "register";
    setWebhookLoading(true);
    try {
      const res = await fetch("/api/webhooks/github/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update webhook");
        return;
      }
      setWebhookRegistered(!webhookRegistered);
      toast.success(
        webhookRegistered
          ? "Webhook removed — docs won't auto-update"
          : "Webhook registered — docs will auto-update on push",
      );
    } catch {
      toast.error("Failed to update webhook");
    } finally {
      setWebhookLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
          className="text-[13px] h-8 bg-muted/40 border-border/60 focus-visible:ring-0"
          placeholder="https://github.com/user/repo"
        />
        {isDirty && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0 shrink-0"
            onClick={commit}
            disabled={update.isPending}
          >
            <CheckIcon className="size-3.5" />
          </Button>
        )}
        {!isDirty && draft && (
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

      {/* Webhook sync row — only show when there's a saved GitHub URL */}
      {value && (
        <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/40">
          <div className="flex items-center gap-1.5 min-w-0">
            {checkingWebhook ? (
              <Loader2Icon className="size-3 text-muted-foreground animate-spin shrink-0" />
            ) : webhookRegistered ? (
              <RefreshCwIcon className="size-3 text-green-500 shrink-0" />
            ) : (
              <RefreshCwOffIcon className="size-3 text-muted-foreground shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-[13px] font-normal truncate">
                {webhookRegistered ? "Auto-sync enabled" : "Auto-sync disabled"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {webhookRegistered
                  ? "Context updates on push or merge"
                  : "Docs won't update automatically"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[11px] px-2 shrink-0"
            onClick={handleWebhookToggle}
            disabled={webhookLoading || checkingWebhook}
          >
            {webhookLoading ? (
              <Loader2Icon className="size-3 animate-spin" />
            ) : webhookRegistered ? (
              "Unsync"
            ) : (
              "Sync"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Logo URL ─────────────────────────────────────────────────────────────────

function LogoUrlField({ value }: { value?: string | null }) {
  const { projectId } = useProjectSnapshot();
  const [tab, setTab] = useState<"url" | "upload">("url");
  const [draft, setDraft] = useState(value ?? "");
  const update = useUpdateProjectLogoUrl(projectId);

  const isDirty = draft !== (value ?? "");

  const commit = () => {
    update.mutate({ id: projectId, logoUrl: draft || null });
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
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
            }}
            className="text-[13px] h-8 bg-muted/40 border-border/60 focus-visible:ring-0"
            placeholder="https://..."
          />
          {isDirty && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 shrink-0"
              onClick={commit}
              disabled={update.isPending}
            >
              <CheckIcon className="size-3.5" />
            </Button>
          )}
          {!isDirty && draft && (
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
        <label className="flex items-center justify-center h-16 border border-dashed border-border/60 rounded-md bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
          {update.isPending ? (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" />
              <span className="text-[11px]">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <UploadIcon className="size-4" />
              <span className="text-[11px]">Click to upload logo</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={update.isPending}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const { uploadUrl, publicUrl } = await fetch(
                "/api/projects/image-upload",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    filename: file.name,
                    contentType: file.type,
                  }),
                },
              ).then((r) => r.json());
              await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type },
              });
              update.mutate({ id: projectId, logoUrl: publicUrl });
              setDraft(publicUrl);
              setTab("url");
            }}
          />
        </label>
      </TabsContent>
    </Tabs>
  );
}

// ─── Project Images Gallery ───────────────────────────────────────────────────

function ProjectImagesField({
  images,
}: {
  images: {
    id: string;
    url: string;
    key: string;
    caption?: string | null;
    order: number;
  }[];
}) {
  const { projectId } = useProjectSnapshot();
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urlDraft, setUrlDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const addImage = useAddProjectImage(projectId);
  const deleteImage = useDeleteProjectImage(projectId);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { uploadUrl, publicUrl, key } = await fetch(
        "/api/projects/image-upload",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        },
      ).then((r) => r.json());
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      addImage.mutate({ projectId, url: publicUrl, key });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleUrlAdd = () => {
    const url = urlDraft.trim();
    if (!url) return;
    addImage.mutate(
      { projectId, url, key: url },
      { onSuccess: () => setUrlDraft("") },
    );
  };

  const handleCopyMarkdown = (img: {
    id: string;
    url: string;
    caption?: string | null;
  }) => {
    const markdown = `![${img.caption ?? "image"}](${img.url})`;
    navigator.clipboard.writeText(markdown);
    setCopiedId(img.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="space-y-1.5">
          {images.map((img) => (
            <div key={img.id} className="flex items-center gap-2 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption ?? "Project image"}
                className="size-10 rounded-md border border-border/60 object-cover shrink-0"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <p className="text-[11px] text-muted-foreground truncate flex-1 min-w-0">
                {img.url}
              </p>
              <button
                onClick={() => handleCopyMarkdown(img)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                title="Copy as Markdown"
              >
                {copiedId === img.id ? (
                  <CheckIcon className="size-3.5 text-green-500" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
              </button>
              <button
                onClick={() => deleteImage.mutate({ id: img.id })}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                title="Delete image"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "upload" | "url")}>
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
        <TabsContent value="upload" className="mt-1.5">
          <label className="flex items-center justify-center h-12 border border-dashed border-border/60 rounded-md bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
            {uploading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2Icon className="size-3.5 animate-spin" />
                <span className="text-[11px]">Uploading...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <UploadIcon className="size-3.5" />
                <span className="text-[11px]">Click to upload</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={handleUpload}
            />
          </label>
        </TabsContent>
        <TabsContent value="url" className="mt-1.5">
          <div className="flex gap-1.5">
            <Input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUrlAdd();
              }}
              className="text-[13px] h-7 bg-muted/40 border-border/60 focus-visible:ring-0"
              placeholder="https://..."
            />
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-7 p-0 shrink-0"
              onClick={handleUrlAdd}
              disabled={!urlDraft.trim() || addImage.isPending}
            >
              <PlusIcon className="size-3" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

function TagsField({ tags = [] }: { tags: string[] }) {
  const { projectId } = useProjectSnapshot();
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
  links,
}: {
  links: { id: string; label: string; url: string; order: number }[];
}) {
  const { projectId } = useProjectSnapshot();
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
              <Link
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-foreground flex-1 truncate hover:underline"
              >
                {link.label}
              </Link>
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

// ─── Published toggle ─────────────────────────────────────────────────────────

function PublishedToggle({
  published,
  username,
  slug,
}: {
  published: boolean;
  username: string;
  slug: string;
}) {
  const { projectId } = useProjectSnapshot();
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
          <Link
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-primary hover:underline truncate flex-1"
          >
            {publicUrl}
          </Link>
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
          <Link
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLinkIcon className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function ProjectSettings() {
  const { projectId } = useProjectSnapshot();
  const { project } = useProject(projectId);
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!project) return null;

  return (
    <div className="space-y-5 py-3 px-6">
      <SettingsSection icon={GlobeIcon} title="Visibility">
        <PublishedToggle
          published={project.published}
          username={project.username}
          slug={project.slug}
        />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={FaGithub} title="GitHub">
        <GithubUrlField value={project.githubUrl} />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={ImageIcon} title="Logo">
        <LogoUrlField value={project.logoUrl} />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={ImageIcon} title="Images">
        <ProjectImagesField images={project.images ?? []} />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={TagIcon} title="Tags">
        <TagsField tags={project.tags ?? []} />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={LinkIcon} title="Links">
        <ProjectLinksField links={project.links ?? []} />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={UsersIcon} title="Collaborators">
        <CollaboratorsField collaborators={project.collaborators ?? []} />
      </SettingsSection>

      <Separator />

      <SettingsSection icon={TriangleAlertIcon} title="Danger Zone">
        <button
          onClick={() => setDeleteOpen(true)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors text-[13px]"
        >
          <Trash2Icon className="size-3.5" />
          Delete project
        </button>
        <ProjectDeleteDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          projectId={project.id}
          projectName={project.name}
          onSuccess={() => router.push("/projects")}
        />
      </SettingsSection>

      <div className="h-32 w-full shrink-0" />
    </div>
  );
}
