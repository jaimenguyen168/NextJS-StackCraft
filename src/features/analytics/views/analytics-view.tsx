"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import PageHeader from "@/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2Icon } from "lucide-react";
import { ProjectAnalytics } from "@/features/analytics/components/project-analytics";
import { EmptyState } from "@/features/analytics/components/empty-state";

export default function AnalyticsView() {
  const trpc = useTRPC();
  const { data: projects, isLoading: loadingProjects } = useQuery(
    trpc.projects.getAll.queryOptions(),
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader title="Analytics" />

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 container mx-auto space-y-6">
        {/* Project selector */}
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium shrink-0">Project</p>

          {loadingProjects ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2Icon className="size-3.5 animate-spin" />
              Loading…
            </div>
          ) : (
            <Select
              value={selectedId ?? ""}
              onValueChange={(v) => setSelectedId(v || null)}
            >
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Choose a project…" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {selectedId ? (
          <ProjectAnalytics key={selectedId} projectId={selectedId} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
