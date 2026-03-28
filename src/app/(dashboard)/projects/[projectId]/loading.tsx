import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      <p className="text-sm">Loading project...</p>
    </div>
  );
}
