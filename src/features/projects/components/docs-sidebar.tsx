"use client";

import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  const defaultOpenSections = sections.map((s) => s.id);

  return (
    <Sidebar collapsible="offcanvas" className="border-r">
      <SidebarHeader className="border-b p-4">
        <Link
          href={projectUrl}
          className="font-semibold text-sm hover:text-primary transition-colors truncate no-underline"
        >
          {projectName}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <Accordion
                type="multiple"
                defaultValue={defaultOpenSections}
                className="w-full"
              >
                {sections.map((section) => {
                  const sectionBlocks = blocks.filter(
                    (b) => b.sectionId === section.id,
                  );

                  return (
                    <AccordionItem
                      key={section.id}
                      value={section.id}
                      className="border-none"
                    >
                      <AccordionTrigger className="px-2 py-1.5 text-sm font-medium hover:bg-muted/60 rounded-md no-underline hover:no-underline *:no-underline! [&[data-state=open]>svg]:rotate-180">
                        {section.title}
                      </AccordionTrigger>
                      <AccordionContent className="pb-0">
                        <SidebarMenuSub>
                          {sectionBlocks.map((block) => (
                            <SidebarMenuSubItem key={block.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={currentBlockId === block.id}
                                className="no-underline!"
                              >
                                <Link
                                  href={`${baseUrl}?block=${block.id}`}
                                  className="flex items-center gap-1.5 no-underline"
                                >
                                  {block.title}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}

                          {section.children.map((child) => {
                            const childBlocks = blocks.filter(
                              (b) => b.sectionId === child.id,
                            );

                            return (
                              <SidebarMenuItem
                                key={child.id}
                                className="list-none"
                              >
                                <Accordion
                                  type="multiple"
                                  defaultValue={[child.id]}
                                  className="w-full"
                                >
                                  <AccordionItem
                                    value={child.id}
                                    className="border-none"
                                  >
                                    <AccordionTrigger className="px-2 py-1.5 font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md no-underline hover:no-underline *:no-underline [&[data-state=open]>svg]:rotate-180">
                                      {child.title}
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-0">
                                      <SidebarMenuSub>
                                        {childBlocks.map((block) => (
                                          <SidebarMenuSubItem key={block.id}>
                                            <SidebarMenuSubButton
                                              asChild
                                              isActive={
                                                currentBlockId === block.id
                                              }
                                              className="no-underline!"
                                            >
                                              <Link
                                                href={`${baseUrl}?block=${block.id}`}
                                                className="flex items-center gap-1.5 no-underline"
                                              >
                                                {block.title}
                                              </Link>
                                            </SidebarMenuSubButton>
                                          </SidebarMenuSubItem>
                                        ))}
                                      </SidebarMenuSub>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </SidebarMenuItem>
                            );
                          })}
                        </SidebarMenuSub>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
