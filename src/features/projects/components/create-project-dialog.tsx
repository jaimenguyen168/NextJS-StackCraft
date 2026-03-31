"use client";

import React, { useState } from "react";
import {
  Loader2Icon,
  CheckIcon,
  FileTextIcon,
  LockIcon,
  RefreshCwIcon,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useCreateProject } from "@/trpc/hooks/use-projects";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createUsername } from "@/lib/utils";
import {
  useCheckGithubCredit,
  useInvalidateUsage,
} from "@/trpc/hooks/use-usage";
import { toast } from "sonner";

type Step = "choose" | "github" | "manual" | "fetching" | "ready";

interface RepoPreview {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  hasSchema: boolean;
  hasOpenApi: boolean;
  routeCount: number;
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const router = useRouter();
  const { user } = useUser();
  const createProject = useCreateProject();
  const { allowed: githubCreditAllowed, used, limit } = useCheckGithubCredit();
  const invalidateUsage = useInvalidateUsage();

  const [step, setStep] = useState<Step>("choose");
  const [githubUrl, setGithubUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [preview, setPreview] = useState<RepoPreview | null>(null);
  const [enableWebhook, setEnableWebhook] = useState(true);

  const [manualName, setManualName] = useState("");
  const [manualDescription, setManualDescription] = useState("");

  const resetDialog = () => {
    setStep("choose");
    setGithubUrl("");
    setUrlError("");
    setPreview(null);
    setEnableWebhook(true);
    setManualName("");
    setManualDescription("");
  };

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v) resetDialog();
  };

  const handleFetchRepo = async () => {
    setUrlError("");
    setStep("fetching");

    try {
      const res = await fetch("/api/projects/github/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl: githubUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setUrlError(data.error ?? "Failed to fetch repository.");
        setStep("github");
        return;
      }

      setPreview(data);
      setStep("ready");
    } catch {
      setUrlError("Failed to fetch repository. Check the URL and try again.");
      setStep("github");
    }
  };

  const handleCreateFromGitHub = () => {
    if (!preview) return;

    if (!githubCreditAllowed) {
      onOpenChange(false);
      toast(
        <div className="flex flex-col gap-2 w-fit">
          <p className="text-sm font-medium">
            Monthly GitHub import limit reached ({used}/{limit}).
          </p>
          <Button
            size="sm"
            onClick={() => {
              router.push("/pricing");
              toast.dismiss();
            }}
            className="w-fit cursor-pointer"
          >
            Upgrade plan
          </Button>
        </div>,
      );
      return;
    }

    createProject.mutate(
      {
        name: preview.name,
        description: preview.description ?? preview.name,
        username: createUsername(user),
      },
      {
        onSuccess: (project) => {
          handleOpenChange(false);
          router.push(`/projects/${project.id}`);
          fetch("/api/projects/github/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId: project.id,
              githubUrl: githubUrl.trim(),
              enableWebhook,
            }),
          }).then(() => {
            invalidateUsage();
          });
        },
      },
    );
  };

  const handleCreateManual = () => {
    if (!manualName.trim()) return;
    createProject.mutate(
      {
        name: manualName.trim(),
        description: manualDescription.trim() || manualName.trim(),
        username: createUsername(user),
      },
      {
        onSuccess: (project) => {
          handleOpenChange(false);
          router.push(`/projects/${project.id}`);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>

        {/* Step: choose */}
        {step === "choose" && (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              How would you like to start?
            </p>
            <button
              onClick={() => setStep("github")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
            >
              <FaGithub className="size-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Import from GitHub</p>
                <p className="text-xs text-muted-foreground">
                  Auto-generate docs from your repo
                </p>
              </div>
            </button>
            <button
              onClick={() => setStep("manual")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
            >
              <FileTextIcon className="size-5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Start from scratch</p>
                <p className="text-xs text-muted-foreground">
                  Describe your project and generate docs
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Step: github URL input */}
        {step === "github" && (
          <div className="space-y-4 pt-2">
            {/* Privacy notice */}
            <div className="flex gap-2.5 px-3 py-2.5 rounded-lg bg-muted/50 border border-border/60">
              <LockIcon className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                StackCraft will read your repository&apos;s source files,
                README, and config to generate documentation. We store a
                snapshot of this context to power AI edits. Your code is never
                used for training.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">GitHub Repository URL</Label>
              <Input
                value={githubUrl}
                onChange={(e) => {
                  setGithubUrl(e.target.value);
                  setUrlError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFetchRepo();
                }}
                placeholder="https://github.com/owner/repo"
                className="focus-visible:ring-0"
                autoFocus
              />
              {urlError && (
                <p className="text-xs text-destructive">{urlError}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("choose")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleFetchRepo}
                disabled={!githubUrl.trim()}
              >
                Fetch Repo
              </Button>
            </div>
          </div>
        )}

        {/* Step: fetching */}
        {step === "fetching" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Fetching repository info...
            </p>
          </div>
        )}

        {/* Step: ready — show preview */}
        {step === "ready" && preview && (
          <div className="space-y-4 pt-2">
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold">{preview.name}</p>
                {preview.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {preview.description}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {preview.language && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {preview.language}
                  </span>
                )}
                {preview.topics.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="font-medium text-foreground text-[11px] uppercase tracking-widest">
                  Will generate
                </p>
                <div className="flex items-center gap-1.5">
                  <CheckIcon className="size-3 text-green-500" />
                  Architecture diagram + system overview
                </div>
                {preview.hasSchema && (
                  <div className="flex items-center gap-1.5">
                    <CheckIcon className="size-3 text-green-500" />
                    Entity relationship diagram (Prisma schema found)
                  </div>
                )}
                {preview.hasOpenApi && (
                  <div className="flex items-center gap-1.5">
                    <CheckIcon className="size-3 text-green-500" />
                    API reference (OpenAPI spec found)
                  </div>
                )}
                {preview.routeCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <CheckIcon className="size-3 text-green-500" />
                    {preview.routeCount} route file
                    {preview.routeCount > 1 ? "s" : ""} detected
                  </div>
                )}
              </div>
            </div>

            {/* Auto-update toggle */}
            <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-muted/50 border border-border/60">
              <RefreshCwIcon className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium">Keep docs up to date</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Automatically refresh repo context when you push or merge to
                  the default branch, so your AI assistant stays current.
                </p>
              </div>
              <Switch
                checked={enableWebhook}
                onCheckedChange={setEnableWebhook}
                className="shrink-0 mt-0.5"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("github")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleCreateFromGitHub}
                disabled={createProject.isPending}
              >
                {createProject.isPending ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step: manual */}
        {step === "manual" && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Project Name</Label>
              <Input
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="My Awesome Project"
                className="focus-visible:ring-0"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Description</Label>
              <Input
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateManual();
                }}
                placeholder="What does this project do?"
                className="focus-visible:ring-0"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep("choose")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleCreateManual}
                disabled={!manualName.trim() || createProject.isPending}
              >
                {createProject.isPending ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
