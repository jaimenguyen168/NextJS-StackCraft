"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoryIcon, NavigationIcon } from "lucide-react";

interface ProjectSidePanelProps {
  project: {
    documents: { id: string; title: string }[];
    diagrams: { id: string; title: string }[];
  };
}

export default function ProjectSidePanel({ project }: ProjectSidePanelProps) {
  const [activeTab, setActiveTab] = useState("navigation");

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
              value="navigation"
              className="flex-1 h-full gap-2 rounded-none bg-transparent border-0 shadow-none text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <NavigationIcon className="size-4" />
              Navigation
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex-1 h-full gap-2 rounded-none bg-transparent border-0 shadow-none text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <HistoryIcon className="size-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Full border */}
          <div className="absolute bottom-0 inset-x-0 h-px bg-border" />

          {/* Sliding indicator on top of border */}
          <div
            className="absolute bottom-0 h-px w-1/2 bg-foreground transition-transform duration-300 ease-in-out"
            style={{
              transform: `translateX(${activeTab === "navigation" ? "0%" : "100%"})`,
            }}
          />
        </div>

        <TabsContent
          value="navigation"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto p-3"
        >
          <div className="space-y-1">
            {project.documents.length === 0 && project.diagrams.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                Sections will appear here once generated.
              </p>
            ) : (
              <>
                {project.documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleScrollTo(`doc-${doc.id}`)}
                    className="w-full text-left text-[13px] px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    {doc.title}
                  </button>
                ))}
                {project.diagrams.map((diagram) => (
                  <button
                    key={diagram.id}
                    onClick={() => handleScrollTo(`diagram-${diagram.id}`)}
                    className="w-full text-left text-[13px] px-2 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    {diagram.title}
                  </button>
                ))}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="history"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto p-3"
        >
          <p className="text-xs text-muted-foreground px-2 py-4 text-center">
            Prompt history will appear here.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
