// src/features/projects/components/project-card.tsx
"use client";

import React from "react";
import { FolderOpenIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Project } from "@/generated/prisma/client";

interface ProjectCardProps {
  project: Project;
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  GENERATING:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  COMPLETE:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-150 hover:shadow-sm hover:border-border/80 cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
            <FolderOpenIcon className="size-4 text-muted-foreground" />
          </div>
          <h3 className="text-[13px] font-medium tracking-tight text-foreground line-clamp-1">
            {project.name}
          </h3>
        </div>
        <Badge
          className={cn(
            "text-[11px] px-2 py-0.5 rounded-md font-medium border-0",
            statusStyles[project.status],
          )}
        >
          {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
        </Badge>
      </div>

      <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
        {project.description}
      </p>

      <p className="text-[11px] text-muted-foreground/60 mt-auto">
        {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
      </p>
    </div>
  );
}
