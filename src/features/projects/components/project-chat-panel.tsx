"use client";

import { SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ProjectChatPanel() {
  return (
    <div className="shrink-0">
      <div className="p-3 space-y-2">
        <Textarea
          placeholder="Ask AI to edit or improve any section..."
          className="min-h-36 resize-none text-sm border-border/60 bg-muted/30 focus-visible:ring-0 focus-visible:border-primary/50"
        />
        <div className="flex items-center justify-end">
          <Button size="sm">
            <SendIcon className="size-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
