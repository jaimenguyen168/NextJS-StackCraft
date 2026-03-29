"use client";

import { formatDistanceToNow } from "date-fns";
import { SparklesIcon, UserIcon, RotateCcwIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  useProjectSnapshot,
  type ProjectState,
} from "@/features/projects/contexts/project-snapshot-context";
import { useGetChat, useRestoreProject } from "@/trpc/hooks/use-projects";
import { toast } from "sonner";

interface Snapshot {
  edited?: { id: string; type: string; title: string }[];
  created?: { id: string; type: string; title: string }[];
  projectState?: ProjectState;
}

export const ProjectHistory = ({ projectId }: { projectId: string }) => {
  const { data: messages } = useGetChat(projectId);
  const { snapshot: activeSnapshot, setSnapshot } = useProjectSnapshot();
  const restore = useRestoreProject(projectId);

  if (messages.length === 0) {
    return (
      <p className="text-xs text-muted-foreground px-2 py-4 text-center">
        No history yet. Start editing your project to see changes here.
      </p>
    );
  }

  const lastSnapshotMsg = [...messages].reverse().find((m) => {
    const snap = m.snapshot as Snapshot | null;
    return !!snap?.projectState;
  });

  return (
    <div className="space-y-1 p-3">
      {messages.map((msg) => {
        const snapshot = msg.snapshot as Snapshot | null;
        const isLast = msg.id === lastSnapshotMsg?.id;

        if (msg.role === "ASSISTANT") {
          const isActive = activeSnapshot === snapshot?.projectState;
          const isShowing = isActive || (isLast && !activeSnapshot);

          return (
            <div
              key={msg.id}
              role="button"
              onClick={() => {
                if (isActive || isLast) setSnapshot(null);
                else setSnapshot(snapshot!.projectState!);
              }}
              className={cn(
                "group w-full flex gap-2 text-left rounded-lg px-2 py-2 transition-all duration-150 cursor-pointer",
                "border border-transparent",
                "hover:bg-muted/60 hover:border-border",
                isShowing && "bg-primary/5 border-primary/20",
              )}
            >
              <SparklesIcon
                className={cn(
                  "size-3 shrink-0 mt-0.5",
                  isShowing ? "text-primary" : "text-primary/70",
                )}
              />
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="leading-relaxed text-[12px] text-foreground">
                    {msg.content}
                  </p>
                  {isLast && (
                    <Badge className="text-[10px] px-1.5 py-0 h-4 rounded-sm font-medium border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0">
                      current
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(msg.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              {isActive && !isLast && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    restore.mutate(
                      { projectId, snapshot: snapshot!.projectState! },
                      {
                        onSuccess: () => {
                          setSnapshot(null);
                          toast.success("Project restored");
                        },
                        onError: () => toast.error("Failed to restore"),
                      },
                    );
                  }}
                  title="Restore to this snapshot"
                  className="shrink-0 p-1 rounded hover:bg-primary/10 transition-colors"
                >
                  <RotateCcwIcon
                    className={cn(
                      "size-3",
                      restore.isPending
                        ? "animate-spin text-primary"
                        : "text-primary/70 hover:text-primary",
                    )}
                  />
                </button>
              )}
            </div>
          );
        }

        const userSnapshot = snapshot?.projectState;
        const isUserActive = !!userSnapshot && activeSnapshot === userSnapshot;
        const isShowing = isUserActive || (isLast && !activeSnapshot);

        if (userSnapshot) {
          return (
            <div
              key={msg.id}
              role="button"
              onClick={() => {
                if (isUserActive || isLast) setSnapshot(null);
                else setSnapshot(userSnapshot);
              }}
              className={cn(
                "group w-full flex gap-2 text-left rounded-lg px-2 py-2 transition-all duration-150 cursor-pointer",
                "border border-transparent",
                "hover:bg-muted/60 hover:border-border",
                isShowing && "bg-primary/5 border-primary/20",
              )}
            >
              <UserIcon
                className={cn(
                  "size-3 shrink-0 mt-0.5",
                  isShowing ? "text-primary" : "text-muted-foreground/80",
                )}
              />
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p
                    className={cn(
                      "leading-relaxed text-[12px]",
                      isShowing ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {msg.content}
                  </p>
                  {isLast && (
                    <Badge className="text-[10px] px-1.5 py-0 h-4 rounded-sm font-medium border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 shrink-0">
                      current
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground/80">
                  {formatDistanceToNow(new Date(msg.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              {isUserActive && !isLast && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    restore.mutate(
                      { projectId, snapshot: userSnapshot },
                      {
                        onSuccess: () => {
                          setSnapshot(null);
                          toast.success("Project restored");
                        },
                        onError: () => toast.error("Failed to restore"),
                      },
                    );
                  }}
                  title="Restore to this snapshot"
                  className="shrink-0 p-1 rounded hover:bg-primary/10 transition-colors"
                >
                  <RotateCcwIcon
                    className={cn(
                      "size-3",
                      restore.isPending
                        ? "animate-spin text-primary"
                        : "text-primary/70 hover:text-primary",
                    )}
                  />
                </button>
              )}
            </div>
          );
        }

        return (
          <div key={msg.id} className="flex gap-2 px-2 py-2">
            <UserIcon className="size-3 shrink-0 mt-0.5 text-muted-foreground/80" />
            <div className="space-y-0.5 min-w-0 flex-1">
              <p className="leading-relaxed text-[12px] text-muted-foreground">
                {msg.content}
              </p>
              <p className="text-[10px] text-muted-foreground/80">
                {formatDistanceToNow(new Date(msg.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
