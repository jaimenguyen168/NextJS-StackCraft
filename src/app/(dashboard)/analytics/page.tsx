import React from "react";
import { Metadata } from "next";
import AnalyticsView from "@/features/analytics/views/analytics-view";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return <AnalyticsView />;
}
