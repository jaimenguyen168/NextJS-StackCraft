"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SparklesIcon } from "lucide-react";
import MermaidDiagram from "@/components/mermaid-diagram";
import {
  ContentBlockState,
  SectionState,
} from "@/features/projects/contexts/project-snapshot-context";

interface ContentBlock {
  id: string;
  kind: string;
  title: string;
  content: string;
  body?: string | null;
  sectionId?: string | null;
}

interface SectionChild {
  id: string;
  title: string;
  order: number;
  children?: SectionChild[];
}

interface Section {
  id: string;
  title: string;
  order: number;
  children: SectionChild[];
}

interface ProjectContentPanelProps {
  project: {
    name: string;
    description: string;
    mainColor?: string | null;
    mainContent?: string | null;
    contentBlocks: ContentBlockState[];
    sections: SectionState[];
  };
}

function Block({ block }: { block: ContentBlock }) {
  return (
    <div
      key={block.id}
      id={`block-${block.id}`}
      className="space-y-3 scroll-mt-4"
    >
      <h2 className="text-base font-semibold border-b pb-2">{block.title}</h2>
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
  );
}

function SectionGroup({
  section,
  blocks,
  depth = 0,
}: {
  section: Section | SectionChild;
  blocks: ContentBlock[];
  depth?: number;
}) {
  const sectionBlocks = blocks.filter((b) => b.sectionId === section.id);
  const children = "children" in section ? (section.children ?? []) : [];

  if (sectionBlocks.length === 0 && children.length === 0) return null;

  return (
    <div
      className={`space-y-6 ${depth > 0 ? "ml-4 pl-4 border-l border-border/50" : ""}`}
    >
      <h2
        className={`font-semibold border-b pb-2 ${depth === 0 ? "text-lg" : "text-base text-muted-foreground"}`}
      >
        {section.title}
      </h2>
      <div className="space-y-8">
        {sectionBlocks.map((block) => (
          <Block key={block.id} block={block} />
        ))}
        {children.map((child) => (
          <SectionGroup
            key={child.id}
            section={child}
            blocks={blocks}
            depth={depth + 1}
          />
        ))}
      </div>
    </div>
  );
}

export default function ProjectContentPanel({
  project,
}: ProjectContentPanelProps) {
  const sections = project.sections ?? [];
  const ungroupedBlocks = project.contentBlocks.filter((b) => !b.sectionId);

  return (
    <div className="absolute inset-0 overflow-y-auto">
      {/* Cover */}
      <div
        className="relative flex h-48 w-full items-center justify-center shrink-0"
        style={{ backgroundColor: project.mainColor ?? "hsl(var(--primary))" }}
      >
        <h1 className="text-2xl font-bold text-white drop-shadow-sm px-6 text-center">
          {project.name}
        </h1>
      </div>

      <div className="p-4 lg:p-6 space-y-8">
        {/* Description */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="p-3 rounded-lg bg-muted">
            <SparklesIcon className="size-4" />
          </div>
          <span>{project.description}</span>
        </div>

        {/* Main content (abstract, background, etc.) */}
        {project.mainContent && (
          <div
            id="main-content"
            className="prose prose-sm dark:prose-invert max-w-none"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {project.mainContent}
            </ReactMarkdown>
          </div>
        )}

        {/* Sections */}
        {sections.map((section) => (
          <SectionGroup
            key={section.id}
            section={section}
            blocks={project.contentBlocks}
          />
        ))}

        {/* Ungrouped blocks */}
        {ungroupedBlocks.map((block) => (
          <Block key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
}
