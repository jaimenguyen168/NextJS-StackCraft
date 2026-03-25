import React from "react";
import ProjectsView from "@/features/projects/views/projects-view";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return <ProjectsView />;
}
