"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import PageHeader from "@/components/page-header";

interface ProjectDetailsViewProps {
  projectId: string;
}

export default function ProjectDetailsView({
  projectId,
}: ProjectDetailsViewProps) {
  const trpc = useTRPC();
  const { data: project } = useSuspenseQuery(
    trpc.projects.getById.queryOptions({ id: projectId }),
  );

  if (!project)
    return <div className="p-6 text-muted-foreground">Project not found.</div>;

  return (
    <div className="flex flex-col flex-1">
      <PageHeader title={project.name} />
      <div className="p-4 lg:p-6 space-y-4">
        <p className="text-sm text-muted-foreground">{project.description}</p>
        <p className="text-xs text-muted-foreground">
          Status: {project.status}
        </p>
      </div>
    </div>
  );
}
