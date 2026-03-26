import { trpc, HydrateClient, prefetch } from "@/trpc/server";
import ProjectDetailsView from "@/features/projects/views/project-details-view";

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  prefetch(trpc.projects.getById.queryOptions({ id: projectId }));

  return (
    <HydrateClient>
      <ProjectDetailsView projectId={projectId} />
    </HydrateClient>
  );
}
