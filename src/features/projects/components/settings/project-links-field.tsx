"use client";

import React, { useState } from "react";
import { LinkIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useProjectSnapshot } from "@/features/projects/contexts/project-snapshot-context";
import { useAddProjectLink, useDeleteProjectLink } from "@/trpc/hooks/use-projects";

interface ProjectLink {
  id: string;
  label: string;
  url: string;
  order: number;
}

export function ProjectLinksField({ links }: { links: ProjectLink[] }) {
  const { projectId } = useProjectSnapshot();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const addLink = useAddProjectLink(projectId);
  const deleteLink = useDeleteProjectLink(projectId);

  const handleAdd = () => {
    if (!label.trim() || !url.trim()) return;
    addLink.mutate(
      { projectId, label: label.trim(), url: url.trim() },
      { onSuccess: () => { setLabel(""); setUrl(""); } },
    );
  };

  return (
    <div className="space-y-2">
      {links.length > 0 && (
        <div className="space-y-1">
          {links.map((link) => (
            <div key={link.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-muted/40 group">
              <LinkIcon className="size-3 text-muted-foreground/60 shrink-0" />
              <Link
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-foreground flex-1 truncate hover:underline"
              >
                {link.label}
              </Link>
              <button
                onClick={() => deleteLink.mutate({ id: link.id })}
                className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-destructive"
              >
                <Trash2Icon className="size-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-1.5">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="text-[13px] h-7 bg-muted/40 border-border/60 focus-visible:ring-0"
          placeholder="Label (e.g. Live Demo)"
        />
        <div className="flex gap-1.5">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
            className="text-[13px] h-7 bg-muted/40 border-border/60 focus-visible:ring-0"
            placeholder="https://..."
          />
          <Button size="sm" variant="outline" className="h-7 w-7 p-0 shrink-0" onClick={handleAdd} disabled={!label.trim() || !url.trim() || addLink.isPending}>
            <PlusIcon className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
