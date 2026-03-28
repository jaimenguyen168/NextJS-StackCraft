import { trpc, HydrateClient, prefetch } from "@/trpc/server";
import PublicProjectView from "@/features/projects/views/public-project-view";

export default async function PublicProjectPage({
  params,
}: {
  params: Promise<{ username: string; projectSlug: string }>;
}) {
  const { username, projectSlug } = await params;

  try {
    prefetch(
      trpc.projects.getBySlug.queryOptions({ username, slug: projectSlug }),
    );
  } catch {}

  return (
    <HydrateClient>
      <PublicProjectView username={username} projectSlug={projectSlug} />
    </HydrateClient>
  );
}
