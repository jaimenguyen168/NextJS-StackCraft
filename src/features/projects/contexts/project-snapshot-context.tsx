"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface ContentBlockState {
  id: string;
  kind: string;
  type: string;
  title: string;
  content: string;
  body?: string | null;
  order: number;
  sectionId?: string | null;
}

export interface SectionChildState {
  id: string;
  title: string;
  order: number;
  parentId?: string | null;
  children: SectionChildState[];
}

export interface SectionState {
  id: string;
  title: string;
  order: number;
  parentId?: string | null;
  children: SectionChildState[];
}

export interface ProjectState {
  name: string;
  description: string;
  mainColor?: string | null;
  mainContent?: string | null;
  imageUrl?: string | null;
  githubUrl?: string | null;
  contentBlocks: ContentBlockState[];
  sections: SectionState[];
}

interface ProjectSnapshotContextValue {
  projectId: string;
  snapshot: ProjectState | null;
  setSnapshot: (snapshot: ProjectState | null) => void;
}

const ProjectSnapshotContext =
  createContext<ProjectSnapshotContextValue | null>(null);

export function ProjectSnapshotProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) {
  const [snapshot, setSnapshot] = useState<ProjectState | null>(null);
  return (
    <ProjectSnapshotContext.Provider
      value={{ projectId, snapshot, setSnapshot }}
    >
      {children}
    </ProjectSnapshotContext.Provider>
  );
}

export function useProjectSnapshot() {
  const context = useContext(ProjectSnapshotContext);
  if (!context)
    throw new Error(
      "useProjectSnapshot must be used within a ProjectSnapshotProvider",
    );
  return context;
}
