import { trpc, HydrateClient, prefetch } from "@/trpc/server";
import { LandingView } from "@/features/marketing/views/landing-view";

export default async function HomePage() {
  prefetch(trpc.projects.getPublished.queryOptions({ limit: 6 }));

  return (
    <HydrateClient>
      <LandingView />
    </HydrateClient>
  );
}
