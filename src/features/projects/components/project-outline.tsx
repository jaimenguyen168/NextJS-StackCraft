"use client";

import { useState } from "react";
import {
  PencilIcon,
  CheckIcon,
  XIcon,
  SparklesIcon,
  Trash2Icon,
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
  useUpdateProjectName,
  useUpdateDocument,
  useUpdateDiagram,
  useDeleteDocument,
  useDeleteDiagram,
} from "@/trpc/hooks/use-projects";
import { useRouter } from "next/navigation";

interface Project {
  id: string;
  name: string;
  documents: { id: string; title: string; content: string }[];
  diagrams: { id: string; title: string; content: string }[];
}

function DocumentItem({
  doc,
  projectId,
  onSave,
  onScrollTo,
  onCloseAction,
}: {
  doc: { id: string; title: string; content: string };
  projectId: string;
  onSave: (id: string, content: string) => void;
  onScrollTo: (id: string) => void;
  onCloseAction?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(doc.content);
  const deleteDoc = useDeleteDocument(projectId);
  const router = useRouter();

  if (editing) {
    return (
      <div className="space-y-1.5 px-2 py-1">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="text-[13px] min-h-32 resize-none bg-muted/40 border-border/60 focus-visible:ring-0"
          autoFocus
        />
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => {
              onSave(doc.id, draft);
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
              setDraft(doc.content);
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
          onScrollTo(`doc-${doc.id}`);
          onCloseAction?.();
        }}
        className="text-[13px] text-muted-foreground group-hover:text-foreground truncate text-left flex-1"
      >
        {doc.title}
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
                `/projects/${projectId}?prompt=${encodeURIComponent(`Edit the "${doc.title}" section: `)}`,
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
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                title="Delete"
              >
                <Trash2Icon className="size-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete &quot;{doc.title}&quot;?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this document. This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteDoc.mutate({ id: doc.id })}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ButtonGroup>
      </div>
    </div>
  );
}

function DiagramItem({
  diagram,
  projectId,
  onSave,
  onScrollTo,
  onCloseAction,
}: {
  diagram: { id: string; title: string; content: string };
  projectId: string;
  onSave: (id: string, content: string) => void;
  onScrollTo: (id: string) => void;
  onCloseAction?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(diagram.content);
  const deleteDiagram = useDeleteDiagram(projectId);
  const router = useRouter();

  if (editing) {
    return (
      <div className="space-y-1.5 px-2 py-1">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="text-[13px] min-h-32 resize-none bg-muted/40 border-border/60 focus-visible:ring-0 font-mono"
          autoFocus
        />
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            className="h-6 text-xs px-2"
            onClick={() => {
              onSave(diagram.id, draft);
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
              setDraft(diagram.content);
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
          onScrollTo(`diagram-${diagram.id}`);
          onCloseAction?.();
        }}
        className="text-[13px] text-muted-foreground group-hover:text-foreground truncate text-left flex-1"
      >
        {diagram.title}
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
                `/projects/${projectId}?prompt=${encodeURIComponent(`Edit the "${diagram.title}" diagram: `)}`,
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
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                title="Delete"
              >
                <Trash2Icon className="size-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete &quot;{diagram.title}&quot;?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this diagram. This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => deleteDiagram.mutate({ id: diagram.id })}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ButtonGroup>
      </div>
    </div>
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
  const updateDocument = useUpdateDocument(project.id);
  const updateDiagram = useUpdateDiagram(project.id);

  const handleSaveName = () => {
    updateName.mutate({ id: project.id, name: nameDraft });
    setEditingName(false);
  };

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
                onClick={handleSaveName}
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

      {project.documents.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50 px-2 mb-1">
            Documents
          </p>
          <div className="space-y-0.5">
            {project.documents.map((doc) => (
              <DocumentItem
                key={doc.id}
                doc={doc}
                projectId={project.id}
                onSave={(id, content) => updateDocument.mutate({ id, content })}
                onScrollTo={onScrollToAction}
                onCloseAction={onCloseAction}
              />
            ))}
          </div>
        </div>
      )}

      {project.diagrams.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50 px-2 mb-1">
            Diagrams
          </p>
          <div className="space-y-0.5">
            {project.diagrams.map((diagram) => (
              <DiagramItem
                key={diagram.id}
                diagram={diagram}
                projectId={project.id}
                onSave={(id, content) => updateDiagram.mutate({ id, content })}
                onScrollTo={onScrollToAction}
                onCloseAction={onCloseAction}
              />
            ))}
          </div>
        </div>
      )}

      {project.documents.length === 0 && project.diagrams.length === 0 && (
        <p className="text-xs text-muted-foreground px-2 py-4 text-center">
          Sections will appear here once generated.
        </p>
      )}
    </div>
  );
}
