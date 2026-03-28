"use client";

import { useState } from "react";
import {
  PencilIcon,
  CheckIcon,
  XIcon,
  Trash2Icon,
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
} from "@/trpc/hooks/use-projects";
import { useProjectSnapshot } from "@/features/projects/contexts/project-snapshot-context";
import type {
  ContentBlockState,
  SectionState,
  SectionChildState,
} from "@/features/projects/contexts/project-snapshot-context";
import { BlockItem } from "./block-item";

// ─── Add Sub-section Row ──────────────────────────────────────────────────────

function AddSubSectionRow({ parentId }: { parentId: string }) {
  const { projectId } = useProjectSnapshot();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const createSection = useCreateSection(projectId);

  if (adding) {
    return (
      <div className="space-y-1.5 px-2 py-1">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-[13px] h-7 bg-muted/40 border-border/60 focus-visible:ring-0"
          placeholder="Sub-section name..."
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && title.trim()) {
              createSection.mutate(
                { projectId, title: title.trim(), parentId },
                {
                  onSuccess: () => {
                    setTitle("");
                    setAdding(false);
                  },
                },
              );
            }
            if (e.key === "Escape") setAdding(false);
          }}
        />
        <div className="flex gap-1">
          <Button
            size="sm"
            className="h-6 text-xs px-2"
            disabled={!title.trim() || createSection.isPending}
            onClick={() =>
              createSection.mutate(
                { projectId, title: title.trim(), parentId },
                {
                  onSuccess: () => {
                    setTitle("");
                    setAdding(false);
                  },
                },
              )
            }
          >
            <CheckIcon className="size-3" /> Create
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs px-2"
            onClick={() => {
              setAdding(false);
              setTitle("");
            }}
          >
            <XIcon className="size-3" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setAdding(true)}
      className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[13px] text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/40 transition-colors"
    >
      <PlusIcon className="size-3" />
      Add sub-section
    </button>
  );
}

// ─── Section Item ─────────────────────────────────────────────────────────────

interface SectionItemProps {
  section: SectionState | SectionChildState;
  blocks: ContentBlockState[];
  allSections: SectionState[];
  onScrollTo: (id: string) => void;
  onCloseAction?: () => void;
  depth?: number;
}

export function SectionItem({
  section,
  blocks,
  allSections,
  onScrollTo,
  onCloseAction,
  depth = 0,
}: SectionItemProps) {
  const { projectId } = useProjectSnapshot();
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(section.title);
  const updateSection = useUpdateSection(projectId);
  const deleteSection = useDeleteSection(projectId);

  const sectionBlocks = blocks.filter((b) => b.sectionId === section.id);
  const children = "children" in section ? section.children : [];

  return (
    <div className={depth > 0 ? "ml-3" : ""}>
      <div className="group flex items-center justify-between gap-1 px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors">
        {editing ? (
          <div className="flex items-center gap-1 flex-1">
            <Input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              className="text-[13px] h-6 bg-muted/40 border-border/60 focus-visible:ring-0 flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateSection.mutate({ id: section.id, title: titleDraft });
                  setEditing(false);
                }
                if (e.key === "Escape") {
                  setEditing(false);
                  setTitleDraft(section.title);
                }
              }}
            />
            <Button
              size="sm"
              className="h-5 w-5 p-0"
              onClick={() => {
                updateSection.mutate({ id: section.id, title: titleDraft });
                setEditing(false);
              }}
            >
              <CheckIcon className="size-2.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0"
              onClick={() => {
                setEditing(false);
                setTitleDraft(section.title);
              }}
            >
              <XIcon className="size-2.5" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setOpen(!open)}
            className="text-[13px] font-medium text-foreground truncate text-left flex-1 flex items-center gap-1.5"
          >
            {open ? (
              <FolderOpenIcon className="size-3 shrink-0 text-muted-foreground" />
            ) : (
              <FolderIcon className="size-3 shrink-0 text-muted-foreground" />
            )}
            {section.title}
            {sectionBlocks.length > 0 && (
              <span className="text-[10px] text-muted-foreground/50 ml-auto">
                {sectionBlocks.length}
              </span>
            )}
          </button>
        )}
        {!editing && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <ButtonGroup>
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setEditing(true)}
              >
                <PencilIcon className="size-3" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                    <Trash2Icon className="size-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete &quot;{section.title}&quot;?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      The section will be deleted but its content blocks will
                      remain ungrouped.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => deleteSection.mutate({ id: section.id })}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </ButtonGroup>
          </div>
        )}
      </div>

      {open && (
        <div className="ml-3 space-y-0.5">
          {sectionBlocks.map((block) => (
            <BlockItem
              key={block.id}
              block={block}
              sections={allSections}
              onScrollTo={onScrollTo}
              onCloseAction={onCloseAction}
            />
          ))}
          {children.map((child) => (
            <SectionItem
              key={child.id}
              section={child}
              blocks={blocks}
              allSections={allSections}
              onScrollTo={onScrollTo}
              onCloseAction={onCloseAction}
              depth={depth + 1}
            />
          ))}
          {depth === 0 && <AddSubSectionRow parentId={section.id} />}
        </div>
      )}
    </div>
  );
}

// ─── Add Section Row ──────────────────────────────────────────────────────────

export function AddSectionRow() {
  const { projectId } = useProjectSnapshot();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const createSection = useCreateSection(projectId);

  if (adding) {
    return (
      <div className="space-y-1.5 px-2 py-1">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-[13px] h-7 bg-muted/40 border-border/60 focus-visible:ring-0"
          placeholder="Section name..."
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && title.trim()) {
              createSection.mutate(
                { projectId, title: title.trim() },
                {
                  onSuccess: () => {
                    setTitle("");
                    setAdding(false);
                  },
                },
              );
            }
            if (e.key === "Escape") setAdding(false);
          }}
        />
        <div className="flex gap-1">
          <Button
            size="sm"
            className="h-6 text-xs px-2"
            disabled={!title.trim() || createSection.isPending}
            onClick={() =>
              createSection.mutate(
                { projectId, title: title.trim() },
                {
                  onSuccess: () => {
                    setTitle("");
                    setAdding(false);
                  },
                },
              )
            }
          >
            <CheckIcon className="size-3" /> Create
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs px-2"
            onClick={() => {
              setAdding(false);
              setTitle("");
            }}
          >
            <XIcon className="size-3" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setAdding(true)}
      className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[13px] text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted/40 transition-colors"
    >
      <PlusIcon className="size-3" />
      Add section
    </button>
  );
}
