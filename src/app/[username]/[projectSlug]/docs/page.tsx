import { trpc, HydrateClient, prefetch } from "@/trpc/server";
import PublicDocsView from "@/features/projects/views/public-docs-view";

export default async function PublicDocsPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; projectSlug: string }>;
  searchParams: Promise<{ block?: string }>;
}) {
  const { username, projectSlug } = await params;
  const { block } = await searchParams;

  try {
    prefetch(
      trpc.projects.getBySlug.queryOptions({ username, slug: projectSlug }),
    );
  } catch {}

  return (
    <HydrateClient>
      <PublicDocsView
        username={username}
        projectSlug={projectSlug}
        activeBlockId={block ?? null}
      />
    </HydrateClient>
  );
}
