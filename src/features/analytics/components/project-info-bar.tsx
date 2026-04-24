import { GitBranchIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { AnalyticsProject } from "@/features/analytics/types";

const STATUS_COLOR: Record<string, string> = {
  COMPLETE: "bg-green-500/10 text-green-600 dark:text-green-400",
  GENERATING: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  PENDING: "bg-muted text-muted-foreground",
  FAILED: "bg-destructive/10 text-destructive",
};

interface ProjectInfoBarProps {
  project: AnalyticsProject;
}

export function ProjectInfoBar({ project }: ProjectInfoBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg border border-border bg-muted/30 text-xs">
      <span className="font-medium text-foreground">{project.name}</span>

      <span
        className={cn(
          "px-2 py-0.5 rounded-full font-medium",
          STATUS_COLOR[project.status] ?? "bg-muted text-muted-foreground",
        )}
      >
        {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
      </span>

      {project.published && (
        <Badge variant="outline" className="text-[10px] h-5">
          Published
        </Badge>
      )}

      {project.githubUrl && (
        <span className="flex items-center gap-1 text-muted-foreground">
          <GitBranchIcon className="size-3" />
          GitHub
        </span>
      )}

      {project.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {project.tags.slice(0, 4).map((t) => (
            <span key={t} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {t}
            </span>
          ))}
          {project.tags.length > 4 && (
            <span className="text-muted-foreground">+{project.tags.length - 4}</span>
          )}
        </div>
      )}

      <span className="ml-auto text-muted-foreground">
        Created {format(new Date(project.createdAt), "MMM d, yyyy")}
      </span>
    </div>
  );
}
