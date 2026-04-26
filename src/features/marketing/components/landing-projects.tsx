"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ProjectCard } from "@/features/marketing/components/project-card";

export function LandingProjects() {
  const trpc = useTRPC();
  const { data: projects } = useSuspenseQuery(
    trpc.projects.getPublished.queryOptions({ limit: 6 }),
  );

  if (!projects || projects.length === 0) return null;

  return (
    <section className="relative z-10 w-full max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-3">Built with StackCraft</h2>
        <p className="text-white/50 text-[15px] max-w-md mx-auto">
          Real projects from developers who use StackCraft to plan and document their work.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
