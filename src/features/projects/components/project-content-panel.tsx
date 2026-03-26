"use client";

import { FileTextIcon } from "lucide-react";

interface ProjectContentPanelProps {
  project: {
    description: string;
    documents: { id: string; title: string; content: string }[];
    diagrams: { id: string; title: string; content: string }[];
  };
}

export default function ProjectContentPanel({
  project,
}: ProjectContentPanelProps) {
  return (
    <div className="absolute inset-0 overflow-y-auto p-4 lg:p-6 space-y-6">
      {/* Placeholder content area */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileTextIcon className="size-4" />
        <span>Project content will render here</span>
      </div>

      <p className="text-sm text-muted-foreground">{project.description}</p>

      {project.documents.map((doc) => (
        <div
          key={doc.id}
          id={`doc-${doc.id}`}
          className="space-y-2 scroll-mt-4"
        >
          <h2 className="text-base font-semibold">{doc.title}</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {doc.content}
          </p>
        </div>
      ))}

      {project.diagrams.map((diagram) => (
        <div
          key={diagram.id}
          id={`diagram-${diagram.id}`}
          className="space-y-2 scroll-mt-4"
        >
          <h2 className="text-base font-semibold">{diagram.title}</h2>
          <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
            {diagram.content}
          </pre>
        </div>
      ))}
    </div>
  );
}
