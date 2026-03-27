"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "@/components/mermaid-diagram";

interface PublicProjectViewProps {
  username: string;
  projectSlug: string;
}

export default function PublicProjectView({
  username,
  projectSlug,
}: PublicProjectViewProps) {
  const trpc = useTRPC();
  const { data: project } = useSuspenseQuery(
    trpc.projects.getBySlug.queryOptions({ username, slug: projectSlug }),
  );

  if (!project) notFound();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">@{username}</p>
          <h1 className="text-lg font-semibold">{project.name}</h1>
        </div>
        <a
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Built with StackCraft
        </a>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        <p className="text-sm text-muted-foreground">{project.description}</p>

        {project.documents.map((doc) => (
          <div key={doc.id} className="space-y-3">
            <h2 className="text-base font-semibold border-b pb-2">
              {doc.title}
            </h2>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {doc.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}

        {project.diagrams.map((diagram) => (
          <div key={diagram.id} className="space-y-3">
            <h2 className="text-base font-semibold border-b pb-2">
              {diagram.title}
            </h2>
            <MermaidDiagram content={diagram.content} />
          </div>
        ))}
      </main>
    </div>
  );
}
