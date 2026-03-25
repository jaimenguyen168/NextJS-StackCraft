import React from "react";
import DashboardView from "@/features/dashboard/views/dashboard-view";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <DashboardView />;
}
