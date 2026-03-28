"use client";

import { useState } from "react";
import {
  CheckIcon,
  XIcon,
  SparklesIcon,
  Trash2Icon,
  FileIcon,
  PencilIcon,
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
import { useUpdateProjectMainContent } from "@/trpc/hooks/use-projects";
import { useRouter } from "next/navigation";

interface MainContentItemProps {
  projectId: string;
  mainContent: string;
  onScrollTo: (id: string) => void;
  onCloseAction?: () => void;
}

export function MainContentItem({
  projectId,
  mainContent,
  onScrollTo,
  onCloseAction,
}: MainContentItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(mainContent);
  const updateMainContent = useUpdateProjectMainContent(projectId);
  const router = useRouter();

  if (editing) {
    return (
      <div className="space-y-1.5 px-2 py-1">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="text-[13px] min-h-32 resize-none bg-muted/40 border-border/60 focus-visible:ring-0"
          autoFocus
          placeholder="Markdown content..."
        />
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => {
              updateMainContent.mutate({ id: projectId, mainContent: draft });
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
            onClick={() => {
              setDraft(mainContent);
              setEditing(false);
            }}
          >
            <XIcon className="size-3" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between gap-1 px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors">
      <button
        onClick={() => {
          onScrollTo("main-content");
          onCloseAction?.();
        }}
        className="text-[13px] text-muted-foreground group-hover:text-foreground truncate text-left flex-1 flex items-center gap-1.5"
      >
        <FileIcon className="size-3 shrink-0 text-muted-foreground/60" />
        Project Abstract &amp; Background
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
                `/projects/${projectId}?prompt=${encodeURIComponent("Edit the project abstract and background: ")}`,
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                <Trash2Icon className="size-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Clear project abstract &amp; background?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the main content from the project overview.
                  You can regenerate it later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() =>
                    updateMainContent.mutate({ id: projectId, mainContent: "" })
                  }
                >
                  Clear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ButtonGroup>
      </div>
    </div>
  );
}
