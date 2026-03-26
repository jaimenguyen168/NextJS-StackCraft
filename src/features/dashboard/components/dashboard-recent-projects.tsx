"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import ProjectCard from "@/features/projects/components/project-card";

const DashboardRecentProjects = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const { data } = useSuspenseQuery(trpc.projects.getAll.queryOptions());

  const recent = data.slice(0, 4);

  if (recent.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground tracking-wide">
          Recent projects
        </h2>
        <Button variant="ghost" size="sm" className="text-xs h-7 px-2" asChild>
          <Link href="/projects">
            View all
            <ArrowRightIcon className="size-3" />
          </Link>
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {recent.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => router.push(`/projects/${project.id}`)}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardRecentProjects;

export function DashboardRecentProjectsLoading() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 rounded-md bg-muted animate-pulse" />
        <div className="h-7 w-16 rounded-md bg-muted animate-pulse" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-muted animate-pulse" />
                <div className="h-3.5 w-24 rounded-md bg-muted animate-pulse" />
              </div>
              <div className="h-5 w-16 rounded-md bg-muted animate-pulse" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded-md bg-muted animate-pulse" />
              <div className="h-3 w-2/3 rounded-md bg-muted animate-pulse" />
            </div>
            <div className="h-3 w-20 rounded-md bg-muted animate-pulse mt-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
