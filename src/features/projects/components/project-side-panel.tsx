"use client";

import { ElementType, Suspense, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  HistoryIcon,
  ListIcon,
  SettingsIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
} from "lucide-react";
import { ProjectOutline } from "@/features/projects/components/project-outline";
import { ProjectHistory } from "@/features/projects/components/project-history";
import { ProjectSettings } from "@/features/projects/components/project-settings";
import { useProjectSnapshot } from "@/features/projects/contexts/project-snapshot-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "outline" | "history" | "settings";

const TABS: { value: Tab; icon: ElementType; label: string }[] = [
  { value: "outline", icon: ListIcon, label: "Outline" },
  { value: "history", icon: HistoryIcon, label: "History" },
  { value: "settings", icon: SettingsIcon, label: "Settings" },
];

export default function ProjectSidePanel() {
  const { projectId } = useProjectSnapshot();
  const [activeTab, setActiveTab] = useState<Tab>("outline");
  const [collapsed, setCollapsed] = useState(false);

  const handleScrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const activeIndex = TABS.findIndex((t) => t.value === activeTab);

  return (
    <div
      className={cn(
        "hidden min-h-0 flex-col border-l lg:flex shrink-0 transition-all duration-300 ease-in-out",
        collapsed ? "w-10" : "w-120",
      )}
    >
      {collapsed ? (
        // Collapsed state — just show the toggle button
        <div className="flex flex-col items-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setCollapsed(false)}
            title="Expand panel"
          >
            <PanelRightOpenIcon className="size-4 text-muted-foreground" />
          </Button>
        </div>
      ) : (
        // Expanded state
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as Tab)}
          className="flex h-full min-h-0 flex-col gap-y-0"
        >
          <div className="relative shrink-0">
            <div className="flex items-center">
              <TabsList className="flex-1 bg-transparent rounded-none h-12! p-0 gap-0 border-none shadow-none">
                {TABS.map(({ value, icon: Icon, label }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="flex-1 h-full gap-1.5 rounded-none bg-transparent border-0 shadow-none text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    <Icon className="size-3.5" />
                    <span className="text-[13px]">{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 mr-1 shrink-0"
                onClick={() => setCollapsed(true)}
                title="Collapse panel"
              >
                <PanelRightCloseIcon className="size-4 text-muted-foreground" />
              </Button>
            </div>
            <div className="absolute bottom-0 inset-x-0 h-px bg-border" />
            <div
              className="absolute bottom-0 h-px bg-foreground transition-transform duration-300 ease-in-out"
              style={{
                width: `${100 / TABS.length}%`,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            />
          </div>

          <TabsContent
            value="outline"
            className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto"
          >
            <ProjectOutline onScrollToAction={handleScrollTo} />
          </TabsContent>

          <TabsContent
            value="history"
            className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto p-3"
          >
            <Suspense fallback={null}>
              <ProjectHistory projectId={projectId} />
            </Suspense>
          </TabsContent>

          <TabsContent
            value="settings"
            className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto"
          >
            <ProjectSettings />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
