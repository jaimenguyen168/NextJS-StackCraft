"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ProjectState {
  description: string;
  documents: {
    id: string;
    title: string;
    content: string;
    type: string;
    order: number;
  }[];
  diagrams: {
    id: string;
    title: string;
    content: string;
    type: string;
    order: number;
  }[];
}

interface ProjectSnapshotContextValue {
  snapshot: ProjectState | null;
  setSnapshot: (snapshot: ProjectState | null) => void;
}

const ProjectSnapshotContext =
  createContext<ProjectSnapshotContextValue | null>(null);

export function ProjectSnapshotProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<ProjectState | null>(null);

  return (
    <ProjectSnapshotContext.Provider value={{ snapshot, setSnapshot }}>
      {children}
    </ProjectSnapshotContext.Provider>
  );
}

export function useProjectSnapshot() {
  const context = useContext(ProjectSnapshotContext);
  if (!context) {
    throw new Error(
      "useProjectSnapshot must be used within a ProjectSnapshotProvider",
    );
  }
  return context;
}

export type { ProjectState };
