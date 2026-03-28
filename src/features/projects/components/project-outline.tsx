"use client";

import { useState } from "react";
import {
  PencilIcon,
  CheckIcon,
  XIcon,
  SparklesIcon,
  Trash2Icon,
  FileTextIcon,
  PlusIcon,
  FolderIcon,
  FolderOpenIcon,
  MoreHorizontalIcon,
  Code2Icon,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  useUpdateProjectName,
  useUpdateBlock,
  useDeleteBlock,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useAssignBlockToSection,
} from "@/trpc/hooks/use-projects";
import type {
  ContentBlockState,
  SectionState,
  SectionChildState,
} from "@/features/projects/contexts/project-snapshot-context";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  contentBlocks: ContentBlockState[];
  sections: SectionState[];
}

function BlockItem({
  block,
  projectId,
  sections,
  onScrollTo,
  onCloseAction,
}: {
  block: ContentBlockState;
  projectId: string;
  sections: SectionState[];
  onScrollTo: (id: string) => void;
  onCloseAction?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(block.content);
  const [bodyDraft, setBodyDraft] = useState(block.body ?? "");
  const updateBlock = useUpdateBlock(projectId);
  const deleteBlock = useDeleteBlock(projectId);
  const assignBlock = useAssignBlockToSection(projectId);
  const router = useRouter();

  if (editing) {
    return (
      <div className="space-y-1.5 px-2 py-1">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className={`text-[13px] min-h-32 resize-none bg-muted/40 border-border/60 focus-visible:ring-0 ${block.kind === "DIAGRAM" ? "font-mono" : ""}`}
          autoFocus
          placeholder={
            block.kind === "DIAGRAM" ? "Mermaid code..." : "Markdown content..."
          }
        />
        {block.kind === "DIAGRAM" && (
          <Textarea
            value={bodyDraft}
            onChange={(e) => setBodyDraft(e.target.value)}
            className="text-[13px] min-h-16 resize-none bg-muted/40 border-border/60 focus-visible:ring-0"
            placeholder="Optional explanation (Markdown)..."
          />
        )}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => {
              updateBlock.mutate({
                id: block.id,
                content: draft,
                body: bodyDraft || undefined,
              });
              setEditing(false);
              onCloseAction?.();
            }}
          >
            <CheckIcon className="size-3" /> Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs px-2"
            onClick={() => setEditing(false)}
          >
            <XIcon className="size-3" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  const allSections = sections.flatMap((s) => [s, ...s.children]);

  return (
    <div className="group flex items-center justify-between gap-1 px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors">
      <button
        onClick={() => {
          onScrollTo(`block-${block.id}`);
          onCloseAction?.();
        }}
        className="text-[13px] text-muted-foreground group-hover:text-foreground truncate text-left flex-1 flex items-center gap-1.5"
      >
        {block.kind === "DIAGRAM" ? (
          <Code2Icon className="size-3 shrink-0 text-muted-foreground/60" />
        ) : (
          <FileTextIcon className="size-3 shrink-0 text-muted-foreground/60" />
        )}
        {block.title}
      </button>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <ButtonGroup>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            title="Edit with AI"
            onClick={() => {
              router.push(
                `/projects/${projectId}?prompt=${encodeURIComponent(`Edit the "${block.title}" section: `)}`,
              );
              onCloseAction?.();
            }}
          >
            <SparklesIcon className="size-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
            title="Edit manually"
            onClick={() => setEditing(true)}
          >
            <PencilIcon className="size-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontalIcon className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {allSections.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FolderIcon className="size-3 mr-2" /> Assign to section
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {block.sectionId && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            assignBlock.mutate({
                              blockId: block.id,
                              sectionId: null,
                            })
                          }
                        >
                          <XIcon className="size-3 mr-2" /> Remove from section
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {allSections.map((s) => (
                      <DropdownMenuItem
                        key={s.id}
                        onClick={() =>
                          assignBlock.mutate({
                            blockId: block.id,
                            sectionId: s.id,
                          })
                        }
                        className={
                          block.sectionId === s.id ? "text-primary" : ""
                        }
                      >
                        {block.sectionId === s.id && (
                          <CheckIcon className="size-3 mr-2" />
                        )}
                        {"parentId" in s && s.parentId
                          ? `  ↳ ${s.title}`
                          : s.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2Icon className="size-3 mr-2" /> Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete "{block.title}"?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this block. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => deleteBlock.mutate({ id: block.id })}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </ButtonGroup>
      </div>
    </div>
  );
}

function AddSubSectionRow({
  projectId,
  parentId,
}: {
  projectId: string;
  parentId: string;
}) {
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

function SectionItem({
  section,
  projectId,
  blocks,
  allSections,
  onScrollTo,
  onCloseAction,
  depth = 0,
}: {
  section: SectionState | SectionChildState;
  projectId: string;
  blocks: ContentBlockState[];
  allSections: SectionState[];
  onScrollTo: (id: string) => void;
  onCloseAction?: () => void;
  depth?: number;
}) {
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
                      Delete "{section.title}"?
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
              projectId={projectId}
              sections={allSections}
              onScrollTo={onScrollTo}
              onCloseAction={onCloseAction}
            />
          ))}
          {children.map((child) => (
            <SectionItem
              key={child.id}
              section={child}
              projectId={projectId}
              blocks={blocks}
              allSections={allSections}
              onScrollTo={onScrollTo}
              onCloseAction={onCloseAction}
              depth={depth + 1}
            />
          ))}
          {/* Only allow sub-sections at depth 0 (max 2 levels) */}
          {depth === 0 && (
            <AddSubSectionRow projectId={projectId} parentId={section.id} />
          )}
        </div>
      )}
    </div>
  );
}

function AddSectionRow({ projectId }: { projectId: string }) {
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

export function ProjectOutline({
  project,
  onScrollToAction,
  onCloseAction,
}: {
  project: Project;
  onScrollToAction: (id: string) => void;
  onCloseAction?: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(project.name);
  const updateName = useUpdateProjectName(project.id);

  const ungroupedBlocks = project.contentBlocks.filter((b) => !b.sectionId);

  return (
    <div className="space-y-3 p-3">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50 px-2 mb-1">
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
                  updateName.mutate({ id: project.id, name: nameDraft });
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
              onClick={() => setEditingName(true)}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <PencilIcon className="size-3 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        )}
      </div>

      {project.sections.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50 px-2 mb-1">
            Sections
          </p>
          <div className="space-y-0.5">
            {project.sections.map((section) => (
              <SectionItem
                key={section.id}
                section={section}
                projectId={project.id}
                blocks={project.contentBlocks}
                allSections={project.sections}
                onScrollTo={onScrollToAction}
                onCloseAction={onCloseAction}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50 px-2 mb-1">
          {project.sections.length > 0 ? "Ungrouped" : "Blocks"}
        </p>
        <div className="space-y-0.5">
          {ungroupedBlocks.length > 0 ? (
            ungroupedBlocks.map((block) => (
              <BlockItem
                key={block.id}
                block={block}
                projectId={project.id}
                sections={project.sections}
                onScrollTo={onScrollToAction}
                onCloseAction={onCloseAction}
              />
            ))
          ) : (
            <p className="text-xs text-muted-foreground px-2 py-2 text-center">
              {project.contentBlocks.length === 0
                ? "Blocks will appear here once generated."
                : "All blocks are assigned to sections."}
            </p>
          )}
        </div>
      </div>

      <AddSectionRow projectId={project.id} />
    </div>
  );
}
