"use client";

import React, { useState } from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, Loader2Icon, CheckIcon, FileTextIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProjectCard from "@/features/projects/components/project-card";
import { useCreateProject, useProjects } from "@/trpc/hooks/use-projects";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createUsername } from "@/lib/utils";
import { FaGithub } from "react-icons/fa";

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

const ProjectsView = () => {
  const router = useRouter();
  const { projects } = useProjects();
  const createProject = useCreateProject();
  const { user } = useUser();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("choose");
  const [githubUrl, setGithubUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [preview, setPreview] = useState<RepoPreview | null>(null);

  const [manualName, setManualName] = useState("");
  const [manualDescription, setManualDescription] = useState("");

  const resetDialog = () => {
    setStep("choose");
    setGithubUrl("");
    setUrlError("");
    setPreview(null);
    setManualName("");
    setManualDescription("");
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
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
    createProject.mutate(
      {
        name: preview.name,
        // Use GitHub description as placeholder — generate route will overwrite with LLM description
        description: preview.description ?? preview.name,
        username: createUsername(user),
      },
      {
        onSuccess: (project) => {
          handleOpenChange(false);
          router.push(`/projects/${project.id}`);
          // Fire and forget — generates in background
          fetch("/api/projects/github/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId: project.id,
              githubUrl: githubUrl.trim(),
            }),
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
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Projects"
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <PlusIcon className="size-4" />
            New Project
          </Button>
        }
      />

      <div className="p-4 lg:p-6">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-muted-foreground text-sm">No projects yet.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setOpen(true)}
            >
              <PlusIcon className="size-4" />
              Create your first project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => router.push(`/projects/${project.id}`)}
              />
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
};

export default ProjectsView;
