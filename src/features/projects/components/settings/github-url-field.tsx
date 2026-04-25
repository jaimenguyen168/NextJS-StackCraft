"use client";

import React, { useState, useEffect } from "react";
import {
  CheckIcon,
  ExternalLinkIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  Loader2Icon,
  RefreshCwIcon,
  RefreshCwOffIcon,
  Trash2Icon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useProjectSnapshot } from "@/features/projects/contexts/project-snapshot-context";
import {
  useUpdateProjectGithubUrl,
  useUpdateProjectGithubToken,
} from "@/trpc/hooks/use-projects";

export function GithubUrlField({
  value,
  token,
}: {
  value?: string | null;
  token?: string | null;
}) {
  const { projectId } = useProjectSnapshot();
  const [draft, setDraft] = useState(value ?? "");
  const [tokenDraft, setTokenDraft] = useState(token ?? "");
  const [showToken, setShowToken] = useState(false);
  const [showTokenInstructions, setShowTokenInstructions] = useState(false);
  const [webhookRegistered, setWebhookRegistered] = useState<boolean | null>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const checkingWebhook = !!value && webhookRegistered === null;
  const update = useUpdateProjectGithubUrl(projectId);
  const updateToken = useUpdateProjectGithubToken(projectId);

  const isDirty = draft !== (value ?? "");
  const isTokenDirty = tokenDraft !== (token ?? "");

  useEffect(() => {
    if (!value) return;
    fetch(`/api/webhooks/github/setup?projectId=${projectId}`)
      .then((r) => r.json())
      .then((data) => setWebhookRegistered(data.registered ?? false))
      .catch(() => setWebhookRegistered(false));
  }, [projectId, value]);

  const commit = () => {
    update.mutate({ id: projectId, githubUrl: draft || null });
  };

  const commitToken = () => {
    updateToken.mutate(
      { id: projectId, githubToken: tokenDraft.trim() || null },
      { onSuccess: () => toast.success("GitHub token saved") },
    );
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
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
          className="text-[13px] h-8 bg-muted/40 border-border/60 focus-visible:ring-0"
          placeholder="https://github.com/user/repo"
        />
        {isDirty && (
          <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" onClick={commit} disabled={update.isPending}>
            <CheckIcon className="size-3.5" />
          </Button>
        )}
        {!isDirty && draft && (
          <a href={draft} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <ExternalLinkIcon className="size-3.5 text-muted-foreground hover:text-foreground transition-colors" />
          </a>
        )}
      </div>

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

      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <KeyIcon className="size-3 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground">
              Personal Access Token{" "}
              <span className="text-muted-foreground/60">(optional — needed to push docs)</span>
            </p>
          </div>
          <button
            onClick={() => setShowTokenInstructions((v) => !v)}
            className="text-[11px] text-primary hover:underline"
          >
            {showTokenInstructions ? "Hide" : "How to get one"}
          </button>
        </div>

        {showTokenInstructions && (
          <div className="rounded-md bg-muted/40 border border-border/40 px-3 py-2 space-y-1 text-[11px] text-muted-foreground">
            <p className="font-medium text-foreground">Generate a GitHub PAT:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Go to <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">github.com → Settings → Developer settings → Personal access tokens → Fine-grained tokens</a></li>
              <li>Set expiration and select your repository under <strong>Repository access</strong></li>
              <li>Under <strong>Permissions → Contents</strong>, select <strong>Read and write</strong></li>
              <li>Under <strong>Permissions → Pull requests</strong>, select <strong>Read and write</strong></li>
              <li>Click <strong>Generate token</strong> and paste it below</li>
            </ol>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Input
              type={showToken ? "text" : "password"}
              value={tokenDraft}
              onChange={(e) => setTokenDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commitToken(); }}
              className="text-[13px] h-8 bg-muted/40 border-border/60 focus-visible:ring-0 pr-8"
              placeholder={token ? "Token saved — paste new one to replace" : "ghp_xxxxxxxxxxxxxxxxxxxx"}
            />
            <button
              type="button"
              onClick={() => setShowToken((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showToken ? <EyeOffIcon className="size-3.5" /> : <EyeIcon className="size-3.5" />}
            </button>
          </div>
          {isTokenDirty && (
            <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" onClick={commitToken} disabled={updateToken.isPending}>
              {updateToken.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" />
              ) : (
                <CheckIcon className="size-3.5" />
              )}
            </Button>
          )}
          {token && !isTokenDirty && (
            <>
              <div className="size-8 flex items-center justify-center shrink-0">
                <CheckIcon className="size-3.5 text-green-500" />
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                title="Remove token"
                onClick={() => {
                  updateToken.mutate(
                    { id: projectId, githubToken: null },
                    { onSuccess: () => { setTokenDraft(""); toast.success("GitHub token removed"); } },
                  );
                }}
                disabled={updateToken.isPending}
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
