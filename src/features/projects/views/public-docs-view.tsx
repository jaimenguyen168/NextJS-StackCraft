"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "@/components/mermaid-diagram";
import Link from "next/link";
import { BookIcon, SunIcon, MoonIcon } from "lucide-react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DocsSidebar } from "@/features/projects/components/docs-sidebar";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

interface PublicDocsViewProps {
  username: string;
  projectSlug: string;
  activeBlockId: string | null;
}

export default function PublicDocsView({
  username,
  projectSlug,
  activeBlockId,
}: PublicDocsViewProps) {
  const trpc = useTRPC();
  const { data: project } = useSuspenseQuery(
    trpc.projects.getBySlug.queryOptions({ username, slug: projectSlug }),
  );
  const { theme, setTheme } = useTheme();

  if (!project) notFound();

  const baseUrl = `/${username}/${projectSlug}/docs`;
  const projectUrl = `/${username}/${projectSlug}`;

  const allSectionedBlocks = project.sections.flatMap((s) => [
    ...project.contentBlocks.filter((b) => b.sectionId === s.id),
    ...s.children.flatMap((c) =>
      project.contentBlocks.filter((b) => b.sectionId === c.id),
    ),
  ]);

  const firstBlockId = allSectionedBlocks[0]?.id ?? null;
  const currentBlockId = activeBlockId ?? firstBlockId;
  const currentBlock = project.contentBlocks.find(
    (b) => b.id === currentBlockId,
  );

  return (
    <SidebarProvider className="h-svh">
      <DocsSidebar
        projectName={project.name}
        projectUrl={projectUrl}
        sections={project.sections}
        blocks={project.contentBlocks}
        currentBlockId={currentBlockId}
        baseUrl={baseUrl}
      />
      <SidebarInset className="min-h-0 min-w-0">
        <div className="flex flex-col flex-1 min-h-0 h-full">
          <header className="border-b px-4 py-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="lg:hidden" />
              <span className="text-muted-foreground/40 text-sm">·</span>
              <span className="text-sm text-muted-foreground">
                Documentation
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                <Link href="https://github.com" target="_blank">
                  <BookIcon className="size-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? (
                  <SunIcon className="size-4" />
                ) : (
                  <MoonIcon className="size-4" />
                )}
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-8 py-8">
            <div className="max-w-3xl mx-auto">
              {currentBlock ? (
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold border-b pb-4">
                    {currentBlock.title}
                  </h1>
                  {currentBlock.kind === "DIAGRAM" ? (
                    <div className="space-y-4">
                      <MermaidDiagram content={currentBlock.content} />
                      {currentBlock.body && (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {currentBlock.body}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {currentBlock.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a section from the sidebar.
                </p>
              )}
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
