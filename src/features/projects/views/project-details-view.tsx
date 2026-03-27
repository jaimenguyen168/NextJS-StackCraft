"use client";

import PageHeader from "@/components/page-header";
import { Loader2 } from "lucide-react";
import { useProject } from "@/trpc/hooks/use-projects";
import ProjectContentPanel from "@/features/projects/components/project-content-panel";
import ProjectChatPanel from "@/features/projects/components/project-chat-panel";
import ProjectSidePanel from "@/features/projects/components/project-side-panel";
import {
  ProjectSnapshotProvider,
  useProjectSnapshot,
} from "@/features/projects/contexts/project-snapshot-context";
import { Suspense } from "react";
import Link from "next/link";

interface ProjectDetailsViewProps {
  projectId: string;
}

function ProjectDetailsContent({ projectId }: ProjectDetailsViewProps) {
  const { project } = useProject(projectId);
  const { snapshot, setSnapshot } = useProjectSnapshot();

  if (!project)
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-2 text-muted-foreground">
        <p className="text-sm">Project not found.</p>
        <Link href="/projects" className="text-xs underline">
          Back to projects
        </Link>
      </div>
    );

  const isGenerating =
    project.status === "GENERATING" || project.status === "PENDING";

  const displayProject = snapshot ?? {
    description: project.description,
    documents: project.documents,
    diagrams: project.diagrams,
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader title={project.name} />
      {isGenerating && (
        <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground border-b bg-muted/30">
          <Loader2 className="size-3.5 animate-spin" />
          Generating your project blueprint...
        </div>
      )}
      {snapshot && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-amber-600 dark:text-amber-400 border-b bg-amber-50 dark:bg-amber-950/20">
          Viewing a historical snapshot —
          <button onClick={() => setSnapshot(null)} className="underline">
            return to live project
          </button>
        </div>
      )}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="flex flex-col flex-1 min-h-0 min-w-0">
          <div className="relative flex-1 min-h-0">
            <div className="absolute inset-0 overflow-y-auto">
              <ProjectContentPanel project={displayProject} />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-background to-transparent" />
          </div>
          <Suspense fallback={null}>
            <ProjectChatPanel project={project} />
          </Suspense>
        </div>
        <ProjectSidePanel project={project} />
      </div>
    </div>
  );
}

export default function ProjectDetailsView({
  projectId,
}: ProjectDetailsViewProps) {
  return (
    <ProjectSnapshotProvider>
      <ProjectDetailsContent projectId={projectId} />
    </ProjectSnapshotProvider>
  );
}
