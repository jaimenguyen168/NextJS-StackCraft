"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersIcon, GlobeIcon, ClockIcon, Loader2Icon } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { StatCard } from "@/features/analytics/components/stat-card";
import { TokenUsageChart } from "@/features/analytics/components/token-usage-chart";
import { ChatHistoryList } from "@/features/analytics/components/chat-history-list";
import { ProjectInfoBar } from "@/features/analytics/components/project-info-bar";

interface ProjectAnalyticsProps {
  projectId: string;
}

export function ProjectAnalytics({ projectId }: ProjectAnalyticsProps) {
  const trpc = useTRPC();
  const { data, isLoading, error } = useQuery(
    trpc.analytics.getProjectData.queryOptions({ projectId }),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-muted-foreground">
        <Loader2Icon className="size-4 animate-spin" />
        <span className="text-sm">Loading analytics…</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-muted-foreground">Failed to load project analytics.</p>
      </div>
    );
  }

  const activeCollaborators = data.collaborators.filter((c) => c.status === "ACCEPTED");
  const pendingCollaborators = data.collaborators.filter((c) => c.status === "PENDING");

  return (
    <div className="space-y-5">
      <ProjectInfoBar project={data.project} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          icon={UsersIcon}
          label="Team Members"
          value={activeCollaborators.length}
          sub={
            pendingCollaborators.length > 0
              ? `${pendingCollaborators.length} invite${pendingCollaborators.length > 1 ? "s" : ""} pending`
              : activeCollaborators.length === 0
                ? "Only you"
                : "active"
          }
        />
        <StatCard
          icon={GlobeIcon}
          label="Visibility"
          value={data.project.published ? "Public" : "Private"}
          sub={data.project.published ? "Accessible via public link" : "Only you and collaborators"}
        />
        <StatCard
          icon={ClockIcon}
          label="Last Updated"
          value={format(new Date(data.project.updatedAt), "MMM d")}
          sub={formatDistanceToNow(new Date(data.project.updatedAt), { addSuffix: true })}
        />
      </div>

      <TokenUsageChart messages={data.chatMessages} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Chat History</CardTitle>
          <p className="text-xs text-muted-foreground">
            Click any message to open the project and browse that conversation
          </p>
        </CardHeader>
        <CardContent className="pt-0 max-h-[400px] overflow-y-auto">
          <ChatHistoryList messages={data.chatMessages} projectId={projectId} />
        </CardContent>
      </Card>
    </div>
  );
}
