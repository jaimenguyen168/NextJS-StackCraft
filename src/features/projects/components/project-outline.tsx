"use client";

import { useState } from "react";
import { PencilIcon, CheckIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUpdateProjectName, useProject } from "@/trpc/hooks/use-projects";
import { useProjectSnapshot } from "@/features/projects/contexts/project-snapshot-context";
import { ColorPickerRow } from "./color-picker-row";
import { MainContentItem } from "./main-content-item";
import { BlockItem } from "./block-item";
import { SectionItem, AddSectionRow } from "./section-item";

export function ProjectOutline({
  onScrollToAction,
  onCloseAction,
}: {
  onScrollToAction: (id: string) => void;
  onCloseAction?: () => void;
}) {
  const { projectId } = useProjectSnapshot();
  const { project } = useProject(projectId);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const updateName = useUpdateProjectName(projectId);

  if (!project) return null;

  const ungroupedBlocks = project.contentBlocks.filter((b) => !b.sectionId);

  return (
    <div className="space-y-3 p-3">
      {/* Project name + color picker */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium px-2 mb-1">
          Project
        </p>
        {editingName ? (
          <div className="space-y-1.5 px-2 py-1">
            <Input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="text-[13px] h-8 bg-muted/40 border-border/60 focus-visible:ring-0"
              autoFocus
            />
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => {
                  updateName.mutate({ id: projectId, name: nameDraft });
                  setEditingName(false);
                }}
              >
                <CheckIcon className="size-3" /> Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs px-2"
                onClick={() => {
                  setEditingName(false);
                  setNameDraft(project.name);
                }}
              >
                <XIcon className="size-3" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="group flex items-center justify-between gap-1 px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors">
            <span className="text-[13px] font-medium text-foreground truncate">
              {project.name}
            </span>
            <button
              onClick={() => {
                setNameDraft(project.name);
                setEditingName(true);
              }}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <PencilIcon className="size-3 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        )}
        <ColorPickerRow projectId={projectId} mainColor={project.mainColor} />
      </div>

      {/* Main content */}
      {project.mainContent && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium px-2 mb-1">
            Introduction
          </p>
          <MainContentItem
            projectId={projectId}
            mainContent={project.mainContent}
            onScrollTo={onScrollToAction}
            onCloseAction={onCloseAction}
          />
        </div>
      )}

      {/* Sections */}
      {project.sections.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium px-2 mb-1">
            Sections
          </p>
          <div className="space-y-0.5">
            {project.sections.map((section) => (
              <SectionItem
                key={section.id}
                section={{
                  ...section,
                  children: section.children.map((c) => ({
                    ...c,
                    children: [],
                  })),
                }}
                blocks={project.contentBlocks}
                allSections={project.sections.map((s) => ({
                  ...s,
                  children: s.children.map((c) => ({ ...c, children: [] })),
                }))}
                onScrollTo={onScrollToAction}
                onCloseAction={onCloseAction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Ungrouped / loose blocks */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-medium px-2 mb-1">
          {project.sections.length > 0 ? "Ungrouped" : "Blocks"}
        </p>
        <div className="space-y-0.5">
          {ungroupedBlocks.map((block) => (
            <BlockItem
              key={block.id}
              block={block}
              sections={project.sections.map((s) => ({
                ...s,
                children: s.children.map((c) => ({ ...c, children: [] })),
              }))}
              onScrollTo={onScrollToAction}
              onCloseAction={onCloseAction}
            />
          ))}
        </div>
      </div>

      <AddSectionRow />
    </div>
  );
}
