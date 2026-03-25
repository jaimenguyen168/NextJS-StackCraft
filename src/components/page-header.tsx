"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface PageHeaderProps {
  title: string;
  className?: string;
  actions?: React.ReactNode;
}

const PageHeader = ({ title, className, actions }: PageHeaderProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      className={cn(
        "flex items-center justify-between border-b px-4 h-14",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </div>
  );
};

export default PageHeader;
