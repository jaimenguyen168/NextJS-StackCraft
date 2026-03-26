"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/page-header";
import { Loader2 } from "lucide-react";

interface ProjectDetailsViewProps {
  projectId: string;
}

export default function ProjectDetailsView({
  projectId,
}: ProjectDetailsViewProps) {
  const trpc = useTRPC();

  const { data: project } = useQuery({
    ...trpc.projects.getById.queryOptions({ id: projectId }),
    // Poll every 3s while generating
    refetchInterval: (query) =>
      query.state.data?.status === "GENERATING" ? 3000 : false,
  });

  if (!project)
    return <div className="p-6 text-muted-foreground">Project not found.</div>;

  const isGenerating =
    project.status === "GENERATING" || project.status === "PENDING";

  return (
    <div className="flex flex-col flex-1">
      <PageHeader title={project.name} />
      <div className="p-4 lg:p-6 space-y-6">
        {isGenerating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Generating your project blueprint...
          </div>
        )}

        <p className="text-sm text-muted-foreground">{project.description}</p>

        {project.documents.map((doc) => (
          <div key={doc.id} className="space-y-2">
            <h2 className="text-base font-semibold">{doc.title}</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {doc.content}
            </p>
          </div>
        ))}

        {project.diagrams.map((diagram) => (
          <div key={diagram.id} className="space-y-2">
            <h2 className="text-base font-semibold">{diagram.title}</h2>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
              {diagram.content}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
