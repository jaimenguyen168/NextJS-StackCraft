"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "@/components/mermaid-diagram";
import Link from "next/link";
import { BookOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const ungroupedBlocks = project.contentBlocks.filter((b) => !b.sectionId);
  const hasSections = project.sections.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">@{username}</p>
          <h1 className="text-lg font-semibold">{project.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          {hasSections && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/${username}/${projectSlug}/docs`}>
                <BookOpenIcon className="size-4" />
                Documentation
              </Link>
            </Button>
          )}
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Built with StackCraft
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        <p className="text-sm text-muted-foreground">{project.description}</p>

        {ungroupedBlocks.map((block) => (
          <div key={block.id} className="space-y-3">
            <h2 className="text-base font-semibold border-b pb-2">
              {block.title}
            </h2>
            {block.kind === "DIAGRAM" ? (
              <div className="space-y-3">
                <MermaidDiagram content={block.content} />
                {block.body && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {block.body}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {block.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
