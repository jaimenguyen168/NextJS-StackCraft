"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Block {
  id: string;
  kind: string;
  title: string;
  sectionId?: string | null;
}

interface SectionChild {
  id: string;
  title: string;
  children?: SectionChild[];
}

interface Section {
  id: string;
  title: string;
  children: SectionChild[];
}

interface DocsSidebarProps {
  projectName: string;
  projectUrl: string;
  sections: Section[];
  blocks: Block[];
  currentBlockId: string | null;
  baseUrl: string;
}

export function DocsSidebar({
  projectName,
  projectUrl,
  sections,
  blocks,
  currentBlockId,
  baseUrl,
}: DocsSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" className="border-r">
      <SidebarHeader className="border-b p-4">
        <Link
          href={projectUrl}
          className="font-semibold text-sm hover:text-primary transition-colors truncate"
        >
          {projectName}
        </Link>
      </SidebarHeader>
      <SidebarContent className="px-3">
        {sections.map((section) => {
          const sectionBlocks = blocks.filter(
            (b) => b.sectionId === section.id,
          );

          return (
            <Collapsible key={section.id} defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 font-medium text-sm hover:bg-muted/60 [&[data-state=open]>svg]:-rotate-90 mt-2">
                {section.title}
                <ChevronLeft className="h-4 w-4 transition-transform duration-200 shrink-0" />
              </CollapsibleTrigger>
              <CollapsibleContent className="ml-2 border-l pl-2">
                {sectionBlocks.map((block) => (
                  <Link
                    key={block.id}
                    href={`${baseUrl}?block=${block.id}`}
                    className={`flex items-center mt-1 px-2 py-1.5 text-sm rounded-md transition-colors ${
                      currentBlockId === block.id
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    {block.title}
                  </Link>
                ))}

                {section.children.map((child) => {
                  const childBlocks = blocks.filter(
                    (b) => b.sectionId === child.id,
                  );

                  return (
                    <Collapsible key={child.id} defaultOpen>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/60 [&[data-state=open]>svg]:-rotate-90 mt-2">
                        {child.title}
                        <ChevronLeft className="size-4 transition-transform duration-200 shrink-0" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-1 ml-2 border-l pl-2">
                        {childBlocks.map((block) => (
                          <Link
                            key={block.id}
                            href={`${baseUrl}?block=${block.id}`}
                            className={`flex items-center px-2 py-1.5 text-sm rounded-md transition-colors ${
                              currentBlockId === block.id
                                ? "bg-muted text-foreground font-medium"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            }`}
                          >
                            {block.title}
                          </Link>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
