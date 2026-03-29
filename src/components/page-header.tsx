"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  className?: string;
  actions?: ReactNode;
}

const PageHeader = ({ title, className, actions }: PageHeaderProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-b px-4 h-14 shrink-0",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <ThemeToggle variant="outline" />
      </div>
    </div>
  );
};

export default PageHeader;
