"use client";

import { useState } from "react";
import { SendIcon, HistoryIcon, ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ProjectOutline, ProjectHistoryContent } from "./project-outline";

interface ProjectChatPanelProps {
  project: {
    id: string;
    name: string;
    documents: { id: string; title: string; content: string }[];
    diagrams: { id: string; title: string; content: string }[];
  };
}

export default function ProjectChatPanel({ project }: ProjectChatPanelProps) {
  const [navOpen, setNavOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleScrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setNavOpen(false);
  };

  return (
    <div className="shrink-0">
      <div className="p-3 space-y-2">
        <Textarea
          placeholder="Ask AI to edit or improve any section..."
          className="min-h-28 resize-none text-sm border-border/60 bg-muted/30 focus-visible:ring-0 focus-visible:border-primary/50"
        />
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3 lg:hidden">
            <Drawer open={navOpen} onOpenChange={setNavOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm">
                  <ListIcon className="size-4" />
                  Outline
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Outline</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto max-h-[60vh]">
                  <ProjectOutline
                    project={project}
                    onScrollToAction={handleScrollTo}
                    onCloseAction={() => setNavOpen(false)}
                  />
                </div>
              </DrawerContent>
            </Drawer>

            <Drawer open={historyOpen} onOpenChange={setHistoryOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm">
                  <HistoryIcon className="size-4" />
                  History
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>History</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto max-h-[60vh] p-3">
                  <ProjectHistoryContent />
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          <Button size="sm" className="ml-auto px-5">
            <SendIcon className="size-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
