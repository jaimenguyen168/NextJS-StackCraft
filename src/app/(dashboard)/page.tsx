import { Metadata } from "next";
import { trpc, HydrateClient, prefetch } from "@/trpc/server";
import DashboardView from "@/features/dashboard/views/dashboard-view";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  prefetch(trpc.projects.getAll.queryOptions());

  return (
    <HydrateClient>
      <DashboardView />
    </HydrateClient>
  );
}
