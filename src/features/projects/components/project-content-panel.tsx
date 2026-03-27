"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SparklesIcon } from "lucide-react";
import MermaidDiagram from "@/components/mermaid-diagram";

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
    <div className="absolute inset-0 overflow-y-auto p-4 lg:p-6 space-y-8">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="p-3 rounded-lg bg-muted">
          <SparklesIcon className="size-4" />
        </div>
        <span>{project.description}</span>
      </div>

      {project.documents.map((doc) => (
        <div
          key={doc.id}
          id={`doc-${doc.id}`}
          className="space-y-3 scroll-mt-4"
        >
          <h2 className="text-base font-semibold border-b pb-2">{doc.title}</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {doc.content}
            </ReactMarkdown>
          </div>
        </div>
      ))}

      {project.diagrams.map((diagram) => (
        <div
          key={diagram.id}
          id={`diagram-${diagram.id}`}
          className="space-y-3 scroll-mt-4"
        >
          <h2 className="text-base font-semibold border-b pb-2">
            {diagram.title}
          </h2>
          <MermaidDiagram content={diagram.content} />
        </div>
      ))}
    </div>
  );
}
