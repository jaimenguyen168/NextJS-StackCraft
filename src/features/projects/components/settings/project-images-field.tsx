"use client";

import React, { useState } from "react";
import { CheckIcon, CopyIcon, GlobeIcon, Loader2Icon, PlusIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjectSnapshot } from "@/features/projects/contexts/project-snapshot-context";
import { useAddProjectImage, useDeleteProjectImage } from "@/trpc/hooks/use-projects";

interface ProjectImage {
  id: string;
  url: string;
  key: string;
  caption?: string | null;
  order: number;
}

export function ProjectImagesField({ images }: { images: ProjectImage[] }) {
  const { projectId } = useProjectSnapshot();
  const [tab, setTab] = useState<"upload" | "url">("upload");
  const [urlDraft, setUrlDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const addImage = useAddProjectImage(projectId);
  const deleteImage = useDeleteProjectImage(projectId);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { uploadUrl, publicUrl, key } = await fetch("/api/projects/image-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      }).then((r) => r.json());
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      addImage.mutate({ projectId, url: publicUrl, key });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleUrlAdd = () => {
    const url = urlDraft.trim();
    if (!url) return;
    addImage.mutate({ projectId, url, key: url }, { onSuccess: () => setUrlDraft("") });
  };

  const handleCopyMarkdown = (img: { id: string; url: string; caption?: string | null }) => {
    navigator.clipboard.writeText(`![${img.caption ?? "image"}](${img.url})`);
    setCopiedId(img.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="space-y-1.5">
          {images.map((img) => (
            <div key={img.id} className="flex items-center gap-2 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption ?? "Project image"}
                className="size-10 rounded-md border border-border/60 object-cover shrink-0"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
              <p className="text-[11px] text-muted-foreground truncate flex-1 min-w-0">{img.url}</p>
              <button
                onClick={() => handleCopyMarkdown(img)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                title="Copy as Markdown"
              >
                {copiedId === img.id ? (
                  <CheckIcon className="size-3.5 text-green-500" />
                ) : (
                  <CopyIcon className="size-3.5" />
                )}
              </button>
              <button
                onClick={() => deleteImage.mutate({ id: img.id })}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                title="Delete image"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <Tabs value={tab} onValueChange={(v) => setTab(v as "upload" | "url")}>
        <TabsList className="h-7 w-full bg-muted/40 border border-border/60 p-0.5 gap-0.5">
          <TabsTrigger value="url" className="flex-1 h-6 text-[11px] data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm">
            <GlobeIcon className="size-3 mr-1" /> URL
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex-1 h-6 text-[11px] data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm">
            <UploadIcon className="size-3 mr-1" /> Upload
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upload" className="mt-1.5">
          <label className="flex items-center justify-center h-12 border border-dashed border-border/60 rounded-md bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
            {uploading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2Icon className="size-3.5 animate-spin" />
                <span className="text-[11px]">Uploading...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <UploadIcon className="size-3.5" />
                <span className="text-[11px]">Click to upload</span>
              </div>
            )}
            <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={handleUpload} />
          </label>
        </TabsContent>
        <TabsContent value="url" className="mt-1.5">
          <div className="flex gap-1.5">
            <Input
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleUrlAdd(); }}
              className="text-[13px] h-7 bg-muted/40 border-border/60 focus-visible:ring-0"
              placeholder="https://..."
            />
            <Button size="sm" variant="outline" className="h-7 w-7 p-0 shrink-0" onClick={handleUrlAdd} disabled={!urlDraft.trim() || addImage.isPending}>
              <PlusIcon className="size-3" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
