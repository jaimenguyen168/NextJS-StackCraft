"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoryIcon, ListIcon } from "lucide-react";
import { ProjectOutline, ProjectHistoryContent } from "./project-outline";

interface ProjectSidePanelProps {
  project: {
    id: string;
    name: string;
    documents: { id: string; title: string; content: string }[];
    diagrams: { id: string; title: string; content: string }[];
  };
}

export default function ProjectSidePanel({ project }: ProjectSidePanelProps) {
  const [activeTab, setActiveTab] = useState("outline");

  const handleScrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="hidden w-100 min-h-0 flex-col border-l lg:flex shrink-0">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex h-full min-h-0 flex-col gap-y-0"
      >
        <div className="relative shrink-0">
          <TabsList className="w-full bg-transparent rounded-none h-12! p-0 gap-0 border-none shadow-none">
            <TabsTrigger
              value="outline"
              className="flex-1 h-full gap-2 rounded-none bg-transparent border-0 shadow-none text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <ListIcon className="size-4" />
              Outline
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex-1 h-full gap-2 rounded-none bg-transparent border-0 shadow-none text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <HistoryIcon className="size-4" /> History
            </TabsTrigger>
          </TabsList>
          <div className="absolute bottom-0 inset-x-0 h-px bg-border" />
          <div
            className="absolute bottom-0 h-px w-1/2 bg-foreground transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(${activeTab === "outline" ? "0%" : "100%"})`,
            }}
          />
        </div>
        <TabsContent
          value="outline"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
          <ProjectOutline project={project} onScrollToAction={handleScrollTo} />
        </TabsContent>
        <TabsContent
          value="history"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto p-3"
        >
          <ProjectHistoryContent />
        </TabsContent>
      </Tabs>
    </div>
  );
}
