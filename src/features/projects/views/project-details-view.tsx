"use client";

import PageHeader from "@/components/page-header";
import { Loader2 } from "lucide-react";
import { useProject } from "@/trpc/hooks/use-projects";
import ProjectContentPanel from "@/features/projects/components/project-content-panel";
import ProjectChatPanel from "@/features/projects/components/project-chat-panel";
import ProjectSidePanel from "@/features/projects/components/project-side-panel";

interface ProjectDetailsViewProps {
  projectId: string;
}

export default function ProjectDetailsView({
  projectId,
}: ProjectDetailsViewProps) {
  const { project } = useProject(projectId);

  if (!project)
    return <div className="p-6 text-muted-foreground">Project not found.</div>;

  const isGenerating =
    project.status === "GENERATING" || project.status === "PENDING";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader title={project.name} />
      {isGenerating && (
        <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground border-b bg-muted/30">
          <Loader2 className="size-3.5 animate-spin" />
          Generating your project blueprint...
        </div>
      )}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left — content + chat */}
        <div className="flex flex-col flex-1 min-h-0 min-w-0">
          <div className="relative flex-1 min-h-0">
            <ProjectContentPanel project={project} />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-background from-5% to-transparent" />
          </div>
          <ProjectChatPanel project={project} />
        </div>
        {/* Right — side panel */}
        <ProjectSidePanel project={project} />
      </div>
    </div>
  );
}
