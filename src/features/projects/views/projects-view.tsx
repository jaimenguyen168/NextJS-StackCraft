"use client";

import React from "react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import ProjectCard from "@/features/projects/components/project-card";
import { useCreateProject, useProjects } from "@/trpc/hooks/use-projects";

const ProjectsView = () => {
  const { projects } = useProjects();
  const createProject = useCreateProject();

  const handleCreate = () => {
    createProject.mutate({
      name: "Untitled Project",
      description: "A new project",
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsView;
