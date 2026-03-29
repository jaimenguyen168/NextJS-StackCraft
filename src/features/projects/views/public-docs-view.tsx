"use client";

import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "@/components/mermaid-diagram";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DocsSidebar } from "@/features/projects/components/docs-sidebar";
import { Button } from "@/components/ui/button";
import { useProjectBySlug } from "@/trpc/hooks/use-projects";
import { ThemeToggle } from "@/components/theme-toggle";
import "@scalar/api-reference-react/style.css";
import { useTheme } from "next-themes";

const ApiReferenceReact = dynamic(
  () => import("@scalar/api-reference-react").then((m) => m.ApiReferenceReact),
  { ssr: false },
);

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
  const { project } = useProjectBySlug(username, projectSlug);
  const { resolvedTheme } = useTheme();

  if (!project)
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-2 text-muted-foreground">
        <p className="text-sm">Project not found.</p>
        <Link href="/projects" className="text-xs underline">
          Back to projects
        </Link>
      </div>
    );

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
      <SidebarInset className="min-h-0 min-w-0 relative overflow-hidden">
        <header className="absolute top-0 inset-x-0 z-50 border-b px-4 py-2.5 flex items-center justify-between bg-background">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="lg:hidden" />
            <span className="text-muted-foreground/40 text-sm">·</span>
            <span className="text-sm font-semibold">Documentation</span>
          </div>
          <div className="flex items-center gap-1">
            {project.githubUrl && (
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                <Link
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaGithub className="size-4" />
                </Link>
              </Button>
            )}
            <ThemeToggle variant="ghost" />
          </div>
        </header>

        <main className="h-full overflow-y-auto px-8 py-8 pt-20 overscroll-none">
          <div className="">
            {currentBlock ? (
              <div className="space-y-6">
                <h1 className="text-2xl font-bold pb-4">
                  {currentBlock.title}
                </h1>
                {currentBlock.type === "openapi_spec" ? (
                  <ApiReferenceReact
                    configuration={{ content: currentBlock.content }}
                  />
                ) : currentBlock.kind === "DIAGRAM" ? (
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
      </SidebarInset>
    </SidebarProvider>
  );
}
