"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ExternalLinkIcon,
  GlobeIcon,
  Loader2Icon,
  RefreshCwIcon,
  RefreshCwOffIcon,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { PRIVACY_CONTENT } from "@/features/settings/constants/privacy-content";

// ─── Row wrapper ──────────────────────────────────────────────────────────────

function PrivacyRow({
  label,
  description,
  action,
}: {
  label: string;
  description?: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

// ─── Privacy Policy Dialog ────────────────────────────────────────────────────

function PrivacyDialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── GitHub Webhook Row ───────────────────────────────────────────────────────

function GitHubWebhookRow({
  projectId,
  projectName,
  githubUrl,
}: {
  projectId: string;
  projectName: string;
  githubUrl: string;
}) {
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  React.useEffect(() => {
    fetch(`/api/webhooks/github/setup?projectId=${projectId}`)
      .then((r) => r.json())
      .then((d) => setRegistered(d.registered ?? false))
      .catch(() => setRegistered(false))
      .finally(() => setChecking(false));
  }, [projectId]);

  const toggle = async () => {
    const action = registered ? "remove" : "register";
    setLoading(true);
    try {
      const res = await fetch("/api/webhooks/github/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed");
        return;
      }
      setRegistered(!registered);
      toast.success(registered ? "Auto-sync disabled" : "Auto-sync enabled");
    } catch {
      toast.error("Failed to update webhook");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-muted/40">
      <div className="flex items-center gap-2.5 min-w-0">
        {checking ? (
          <Loader2Icon className="size-3.5 text-muted-foreground animate-spin shrink-0" />
        ) : registered ? (
          <RefreshCwIcon className="size-3.5 text-green-500 shrink-0" />
        ) : (
          <RefreshCwOffIcon className="size-3.5 text-muted-foreground shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium truncate">{projectName}</p>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors truncate flex items-center gap-1"
          >
            {githubUrl.replace("https://github.com/", "")}
            <ExternalLinkIcon className="size-2.5 shrink-0" />
          </a>
        </div>
      </div>
      <Switch
        checked={registered ?? false}
        onCheckedChange={toggle}
        disabled={loading || checking}
        className="shrink-0"
      />
    </div>
  );
}

// ─── Public Projects ──────────────────────────────────────────────────────────

function PublicProjectsSection() {
  const trpc = useTRPC();
  const { data: projects, isLoading } = useQuery(
    trpc.projects.getAll.queryOptions(),
  );

  const publicProjects = projects?.filter((p) => p.published) ?? [];

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "");

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2Icon className="size-3.5 animate-spin" />
        Loading...
      </div>
    );
  }

  if (publicProjects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No public projects yet. Publish a project to make it visible.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {publicProjects.map((p) => {
        const url = `${appUrl}/${p.username}/${p.slug}`;
        return (
          <div
            key={p.id}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 group"
          >
            <GlobeIcon className="size-3 text-green-500 shrink-0" />
            <span className="text-xs font-medium truncate flex-1 min-w-0">
              {p.name}
            </span>
            <Link
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px] flex items-center gap-1"
            >
              {url.replace(appUrl, "")}
              <ExternalLinkIcon className="size-2.5 shrink-0" />
            </Link>
          </div>
        );
      })}
    </div>
  );
}

// ─── GitHub Webhooks Section ──────────────────────────────────────────────────

function GitHubWebhooksSection() {
  const trpc = useTRPC();
  const { data: projects, isLoading } = useQuery(
    trpc.projects.getAll.queryOptions(),
  );

  const linkedProjects = projects?.filter((p) => p.githubUrl) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2Icon className="size-3.5 animate-spin" />
        Loading...
      </div>
    );
  }

  if (linkedProjects.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No GitHub repositories linked. Import a project from GitHub to enable
        auto-sync.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {linkedProjects.map((p) => (
        <GitHubWebhookRow
          key={p.id}
          projectId={p.id}
          projectName={p.name}
          githubUrl={p.githubUrl!}
        />
      ))}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function PrivacySection() {
  const [dataDialog, setDataDialog] = useState(false);
  const [usageDialog, setUsageDialog] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Privacy</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Control how your data and projects are shared.
        </p>
      </div>

      {/* ── Privacy info ────────────────────────────────────────────── */}
      <div className="space-y-0">
        <PrivacyRow
          label="How we protect your data"
          action={
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1"
              onClick={() => setDataDialog(true)}
            >
              Learn more
            </Button>
          }
        />
        <PrivacyRow
          label="How we use your data"
          action={
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1"
              onClick={() => setUsageDialog(true)}
            >
              Learn more
            </Button>
          }
        />
      </div>

      {/* ── Public projects ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <GlobeIcon className="size-3.5 text-muted-foreground" />
          <h3 className="text-sm font-medium">Public projects</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          These projects are publicly accessible via their URLs.
        </p>
        <PublicProjectsSection />
      </div>

      {/* ── GitHub webhooks ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <FaGithub className="size-3.5 text-muted-foreground" />
          <h3 className="text-sm font-medium">GitHub auto-sync</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          When enabled, StackCraft automatically updates the repository context
          when you push to the default branch.
        </p>
        <GitHubWebhooksSection />
      </div>

      {/* ── Dialogs ──────────────────────────────────────────────────── */}
      <PrivacyDialog
        open={dataDialog}
        onOpenChange={setDataDialog}
        title={PRIVACY_CONTENT.dataProtection.title}
      >
        {PRIVACY_CONTENT.dataProtection.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </PrivacyDialog>

      <PrivacyDialog
        open={usageDialog}
        onOpenChange={setUsageDialog}
        title={PRIVACY_CONTENT.dataUsage.title}
      >
        {PRIVACY_CONTENT.dataUsage.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </PrivacyDialog>
    </div>
  );
}
