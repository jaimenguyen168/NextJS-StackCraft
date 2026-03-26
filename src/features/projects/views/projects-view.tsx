"use client";

import React from "react";
import { useTRPC } from "@/trpc/client";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import ProjectCard from "@/features/projects/components/project-card";

const ProjectsView = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(trpc.projects.getAll.queryOptions());

  const create = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.projects.getAll.queryOptions());
      },
    }),
  );

  const handleCreate = () => {
    create.mutate({
      name: "Untitled Project",
      description: "A new project",
    });
  };

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Projects"
        actions={
          <Button size="sm" onClick={handleCreate} disabled={create.isPending}>
            <PlusIcon className="size-4" />
            New Project
          </Button>
        }
      />
      <div className="p-4 lg:p-6">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-muted-foreground text-sm">No projects yet.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleCreate}
              disabled={create.isPending}
            >
              <PlusIcon className="size-4" />
              Create your first project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsView;
