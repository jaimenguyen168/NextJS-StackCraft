"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MermaidDiagram from "@/components/mermaid-diagram";
import Link from "next/link";
import Image from "next/image";
import { BookOpenIcon, ExternalLinkIcon } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useProjectBySlug } from "@/trpc/hooks/use-projects";

interface PublicProjectViewProps {
  username: string;
  projectSlug: string;
}

export default function PublicProjectView({
  username,
  projectSlug,
}: PublicProjectViewProps) {
  const { project } = useProjectBySlug(username, projectSlug);

  if (!project)
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-2 text-muted-foreground">
        <p className="text-sm">Project not found.</p>
        <Link href="/" className="text-xs underline">
          Back to home
        </Link>
      </div>
    );

  const ungroupedBlocks = project.contentBlocks.filter((b) => !b.sectionId);
  const hasSections = project.sections.length > 0;
  const collaborators = project.collaborators ?? [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top nav */}
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
          <ThemeToggle variant="ghost" />
        </div>
      </header>

      {/* Cover */}
      <div
        className="relative flex h-56 w-full items-center justify-center"
        style={{
          backgroundColor: project.mainColor ?? "oklch(0.6487 0.1538 150.3071)",
        }}
      >
        <div className="flex items-center gap-4 px-6">
          {project.imageUrl && (
            <div className="size-14 rounded-xl overflow-hidden border-2 border-white/20 shrink-0">
              <Image
                src={project.imageUrl}
                alt={project.name}
                width={56}
                height={56}
                className="object-cover w-full h-full"
              />
            </div>
          )}
          <h2 className="text-3xl font-bold text-white drop-shadow-sm text-center">
            {project.name}
          </h2>
        </div>
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 space-y-10">
        {/* Description */}
        <p className="text-sm text-muted-foreground">{project.description}</p>

        {/* Main content */}
        {project.mainContent && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {project.mainContent}
            </ReactMarkdown>
          </div>
        )}

        {/* Content blocks */}
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

        {/* GitHub / visit link */}
        {project.githubUrl && (
          <Link
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground border rounded-lg px-4 py-2 hover:bg-muted/60 transition-colors"
          >
            <FaGithub className="size-4" />
            Visit project on GitHub
            <ExternalLinkIcon className="size-3 text-muted-foreground" />
          </Link>
        )}

        {/* Collaborators */}
        {collaborators.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <h2 className="text-lg font-semibold">Collaborators</h2>
            <div className="flex flex-wrap gap-4">
              {collaborators.map(({ user }) => (
                <Link
                  key={user.id}
                  href={user.githubUrl ?? `https://github.com/${user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group w-24"
                >
                  <Avatar className="size-16 group-hover:ring-2 group-hover:ring-primary transition-all">
                    <AvatarImage
                      src={user.imageUrl ?? undefined}
                      alt={user.name ?? user.username}
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-lg text-sm">
                      {(user.name ?? user.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-center text-primary group-hover:underline truncate w-full">
                    {user.name ?? user.username}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 px-6">
        <Link
          href="/"
          className="flex items-center justify-center gap-3 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <Image
            src="/logo.svg"
            alt="StackCraft"
            width={20}
            height={20}
            className="opacity-50 group-hover:opacity-100 transition-opacity"
          />
          <span className="text-sm">Built with StackCraft</span>
        </Link>
      </footer>
    </div>
  );
}
