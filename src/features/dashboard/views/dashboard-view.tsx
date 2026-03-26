import React, { Suspense } from "react";
import PageHeader from "@/components/page-header";
import DashboardHeader from "@/features/dashboard/components/dashboard-header";
import DashboardInputPanel from "@/features/dashboard/components/dashboard-input-panel";
import DashboardQuickPrompts from "@/features/dashboard/components/dashboard-quick-prompts";
import DashboardRecentProjects, {
  DashboardRecentProjectsLoading,
} from "@/features/dashboard/components/dashboard-recent-projects";

export default function DashboardView() {
  return (
    <div className="relative">
      <PageHeader title="Dashboard" className="lg:hidden" />
      {/*<DashboardHero />*/}
      <div className="relative space-y-8 p-4 lg:p-16 container mx-auto">
        <DashboardHeader />
        <DashboardInputPanel />
        <DashboardQuickPrompts />
        <Suspense fallback={<DashboardRecentProjectsLoading />}>
          <DashboardRecentProjects />
        </Suspense>
      </div>
    </div>
  );
}
