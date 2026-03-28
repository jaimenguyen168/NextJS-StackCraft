"use client";

import { useState } from "react";
import {
  PencilIcon,
  CheckIcon,
  XIcon,
  SparklesIcon,
  Trash2Icon,
  FileTextIcon,
  FolderIcon,
  MoreHorizontalIcon,
  Code2Icon,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
  useUpdateBlock,
  useDeleteBlock,
  useAssignBlockToSection,
} from "@/trpc/hooks/use-projects";
import { useProjectSnapshot } from "@/features/projects/contexts/project-snapshot-context";
import type {
  ContentBlockState,
  SectionState,
} from "@/features/projects/contexts/project-snapshot-context";
import { useRouter } from "next/navigation";

interface BlockItemProps {
  block: ContentBlockState;
  sections: SectionState[];
  onScrollTo: (id: string) => void;
  onCloseAction?: () => void;
}

export function BlockItem({
  block,
  sections,
  onScrollTo,
  onCloseAction,
}: BlockItemProps) {
  const { projectId } = useProjectSnapshot();
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
                    <AlertDialogTitle>
                      Delete &quot;{block.title}&quot;?
                    </AlertDialogTitle>
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
