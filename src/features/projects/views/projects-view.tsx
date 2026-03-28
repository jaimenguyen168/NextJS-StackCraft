"use client";

import React from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import ProjectCard from "@/features/projects/components/project-card";
import { useCreateProject, useProjects } from "@/trpc/hooks/use-projects";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { createUsername } from "@/lib/utils";

const ProjectsView = () => {
  const router = useRouter();
  const { projects } = useProjects();
  const createProject = useCreateProject();
  const { user } = useUser();

  const handleCreate = () => {
    createProject.mutate({
      name: "Untitled Project",
      description: "A new project",
      username: createUsername(user),
    });
  };

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Projects"
        actions={
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={createProject.isPending}
          >
            <PlusIcon className="size-4" />
            New Project
          </Button>
        }
      />
      <div className="p-4 lg:p-6">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-muted-foreground text-sm">No projects yet.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleCreate}
              disabled={createProject.isPending}
            >
              <PlusIcon className="size-4" />
              Create your first project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => router.push(`/projects/${project.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsView;
