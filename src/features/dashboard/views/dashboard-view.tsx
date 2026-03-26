import React from "react";
import PageHeader from "@/components/page-header";
import DashboardHeader from "@/features/dashboard/components/dashboard-header";
import DashboardInputPanel from "@/features/dashboard/components/dashboard-input-panel";

export default function DashboardView() {
  return (
    <div className="relative">
      <PageHeader title="Dashboard" className="lg:hidden" />
      {/*<DashboardHero />*/}
      <div className="relative space-y-8 p-4 lg:p-16 container mx-auto">
        <DashboardHeader />
        <DashboardInputPanel />
      </div>
    </div>
  );
}
