"use client";

import React, { useState } from "react";
import {
  FolderOpenIcon,
  MoreHorizontalIcon,
  GlobeIcon,
  EyeOffIcon,
  ExternalLinkIcon,
  Trash2Icon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Project } from "@/generated/prisma/client";
import { useTogglePublish } from "@/trpc/hooks/use-projects";
import { toast } from "sonner";
import { ProjectDeleteDialog } from "@/features/projects/components/project-delete-dialog";

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  GENERATING:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  COMPLETE:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { toggle, isPending } = useTogglePublish();

  const publicUrl = `/${project.username}/${project.slug}`;

  return (
    <>
      <ProjectDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        projectId={project.id}
        projectName={project.name}
      />
      <div
        onClick={onClick}
        className={cn(
          "group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-150 hover:shadow-sm hover:border-border/80 hover:scale-[1.01]",
          onClick && "cursor-pointer",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted shrink-0">
              <FolderOpenIcon className="size-4 text-muted-foreground" />
            </div>
            <h3 className="text-[13px] font-medium tracking-tight text-foreground line-clamp-1">
              {project.name}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <p className="text-[11px] text-muted-foreground/60">
              {formatDistanceToNow(new Date(project.createdAt), {
                addSuffix: true,
              })}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontalIcon className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {project.published ? (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(publicUrl, "_blank");
                      }}
                    >
                      <ExternalLinkIcon className="size-3.5 mr-2" />
                      View public page
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={isPending}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle(project.id, false, {
                          onSuccess: () => toast.success("Project unpublished"),
                          onError: () => toast.error("Failed to unpublish"),
                        });
                      }}
                    >
                      <EyeOffIcon className="size-3.5 mr-2" />
                      Unpublish
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    disabled={isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(project.id, true, {
                        onSuccess: () => toast.success("Project published"),
                        onError: () => toast.error("Failed to publish"),
                      });
                    }}
                  >
                    <GlobeIcon className="size-3.5 mr-2" />
                    Publish
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2Icon className="size-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        <div className="flex items-center gap-1.5 mt-auto">
          <Badge
            className={cn(
              "text-[11px] px-2 py-0.5 rounded-md font-medium border-0",
              statusStyles[project.status],
            )}
          >
            {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
          </Badge>
          {project.published && (
            <Badge className="text-[11px] px-2 py-0.5 rounded-md font-medium border-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Published
            </Badge>
          )}
        </div>
      </div>
    </>
  );
}
