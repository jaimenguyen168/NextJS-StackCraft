"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteProject } from "@/trpc/hooks/use-projects";
import { toast } from "sonner";

interface ProjectDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  onSuccess?: () => void;
}

export function ProjectDeleteDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  onSuccess,
}: ProjectDeleteDialogProps) {
  const [value, setValue] = useState("");
  const deleteProject = useDeleteProject();

  const handleOpenChange = (open: boolean) => {
    if (!open) setValue("");
    onOpenChange(open);
  };

  const handleDelete = () => {
    deleteProject.mutate(
      { id: projectId },
      {
        onSuccess: () => {
          toast.success("Project deleted");
          handleOpenChange(false);
          onSuccess?.(); // ← call it
        },
        onError: () => toast.error("Failed to delete project"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent aria-describedby={undefined} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            This action is permanent and cannot be undone. Type{" "}
            <span className="font-medium text-foreground">{projectName}</span>{" "}
            to confirm.
          </p>
          <Input
            placeholder={projectName}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && value === projectName) handleDelete();
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={value !== projectName || deleteProject.isPending}
            onClick={handleDelete}
          >
            {deleteProject.isPending ? "Deleting..." : "Delete project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
