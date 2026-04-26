import { Metadata } from "next";
import { trpc, HydrateClient, prefetch } from "@/trpc/server";
import DashboardView from "@/features/dashboard/views/dashboard-view";
import { ErrorBoundary } from "react-error-boundary";
import ErrorFallback from "@/components/error-fallback";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  prefetch(trpc.projects.getAll.queryOptions());
  prefetch(trpc.usage.getUsage.queryOptions());

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<ErrorFallback />}>
        <DashboardView />
      </ErrorBoundary>
    </HydrateClient>
  );
}
