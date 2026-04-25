"use client";

import React, { useState } from "react";
import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { useProjectSnapshot } from "@/features/projects/contexts/project-snapshot-context";
import { useUpdateProjectPublished } from "@/trpc/hooks/use-projects";

export function PublishedToggle({
  published,
  username,
  slug,
}: {
  published: boolean;
  username: string;
  slug: string;
}) {
  const { projectId } = useProjectSnapshot();
  const [copied, setCopied] = useState(false);
  const update = useUpdateProjectPublished(projectId);

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "");
  const publicUrl = `${appUrl}/${username}/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/40">
        <div>
          <Label className="text-[13px] font-normal cursor-pointer">
            {published ? "Published" : "Draft"}
          </Label>
          <p className="text-[11px] text-muted-foreground">
            {published ? "Visible to anyone with the link" : "Only visible to you"}
          </p>
        </div>
        <Switch
          checked={published}
          onCheckedChange={(checked) =>
            update.mutate({ id: projectId, published: checked })
          }
        />
      </div>
      {published && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-muted/20 border border-border/40">
          <Link
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] text-primary hover:underline truncate flex-1"
          >
            {publicUrl}
          </Link>
          <button
            onClick={handleCopy}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            title="Copy link"
          >
            {copied ? (
              <CheckIcon className="size-3.5 text-green-500" />
            ) : (
              <CopyIcon className="size-3.5" />
            )}
          </button>
          <Link
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLinkIcon className="size-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
