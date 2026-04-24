import { BarChart2Icon } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <div className="size-12 rounded-xl bg-muted flex items-center justify-center">
        <BarChart2Icon className="size-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">Select a project to view analytics</p>
        <p className="text-xs text-muted-foreground mt-1">
          Choose a project from the dropdown above to see activity data.
        </p>
      </div>
    </div>
  );
}
