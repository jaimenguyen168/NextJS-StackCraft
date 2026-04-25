"use client";

import React, { useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjectSnapshot } from "@/features/projects/contexts/project-snapshot-context";
import { useUpdateProjectTags } from "@/trpc/hooks/use-projects";

export function TagsField({ tags = [] }: { tags: string[] }) {
  const { projectId } = useProjectSnapshot();
  const [input, setInput] = useState("");
  const update = useUpdateProjectTags(projectId);

  const addTag = () => {
    const tag = input.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || tags.includes(tag)) return;
    update.mutate({ id: projectId, tags: [...tags, tag] });
    setInput("");
  };

  const removeTag = (tag: string) => {
    update.mutate({ id: projectId, tags: tags.filter((t) => t !== tag) });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-6">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[11px] gap-1 pr-1 h-5">
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
              <XIcon className="size-2.5" />
            </button>
          </Badge>
        ))}
        {tags.length === 0 && (
          <p className="text-[12px] text-muted-foreground/50">No tags yet</p>
        )}
      </div>
      <div className="flex gap-1.5">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addTag();
            }
          }}
          className="text-[13px] h-7 bg-muted/40 border-border/60 focus-visible:ring-0"
          placeholder="Add tag, press Enter"
        />
        <Button size="sm" variant="outline" className="h-7 w-7 p-0 shrink-0" onClick={addTag} disabled={!input.trim()}>
          <PlusIcon className="size-3" />
        </Button>
      </div>
    </div>
  );
}
