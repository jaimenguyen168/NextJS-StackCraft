"use client";

import React, { useState } from "react";
import { CheckIcon, GlobeIcon, Loader2Icon, SparklesIcon, UploadIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useProjectSnapshot } from "@/features/projects/contexts/project-snapshot-context";
import { useUpdateProjectLogoUrl } from "@/trpc/hooks/use-projects";
import { LOGO_STYLES, LogoStyle } from "@/features/projects/constants/logo-styles";

export function LogoUrlField({
  value,
  hasOpenaiKey,
}: {
  value?: string | null;
  hasOpenaiKey: boolean;
}) {
  const { projectId } = useProjectSnapshot();
  const router = useRouter();
  const [tab, setTab] = useState<"url" | "upload">("url");
  const [draft, setDraft] = useState(value ?? "");
  const [generating, setGenerating] = useState(false);
  const [style, setStyle] = useState<LogoStyle>("flat");
  const update = useUpdateProjectLogoUrl(projectId);

  const isDirty = draft !== (value ?? "");

  const commit = () => {
    update.mutate({ id: projectId, logoUrl: draft || null });
  };

  const deleteCurrentLogo = () =>
    fetch("/api/projects/delete-logo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    }).catch(() => null);

  const generateLogo = async () => {
    if (!hasOpenaiKey) {
      router.push("/settings");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/projects/generate-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setDraft(data.url);
      update.mutate({ id: projectId, logoUrl: data.url });
      toast.success("Logo generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate logo");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "url" | "upload")}>
        <TabsList className="h-7 w-full bg-muted/40 border border-border/60 p-0.5 gap-0.5">
          <TabsTrigger value="url" className="flex-1 h-6 text-[11px] data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm">
            <GlobeIcon className="size-3 mr-1" /> URL
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex-1 h-6 text-[11px] data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-sm">
            <UploadIcon className="size-3 mr-1" /> Upload
          </TabsTrigger>
        </TabsList>
        <TabsContent value="url" className="mt-1.5">
          <div className="flex items-center gap-1.5">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
              className="text-[13px] h-8 bg-muted/40 border-border/60 focus-visible:ring-0"
              placeholder="https://..."
            />
            {isDirty && (
              <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0" onClick={commit} disabled={update.isPending}>
                <CheckIcon className="size-3.5" />
              </Button>
            )}
            {!isDirty && draft && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={draft}
                alt="preview"
                className="size-8 rounded-md border border-border/60 object-cover shrink-0"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
          </div>
        </TabsContent>
        <TabsContent value="upload" className="mt-1.5">
          <label className="flex items-center justify-center h-16 border border-dashed border-border/60 rounded-md bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
            {update.isPending ? (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                <span className="text-[11px]">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <UploadIcon className="size-4" />
                <span className="text-[11px]">Click to upload logo</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={update.isPending}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await deleteCurrentLogo();
                const { uploadUrl, publicUrl } = await fetch("/api/projects/image-upload", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ filename: file.name, contentType: file.type }),
                }).then((r) => r.json());
                await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
                update.mutate({ id: projectId, logoUrl: publicUrl });
                setDraft(publicUrl);
                setTab("url");
              }}
            />
          </label>
        </TabsContent>
      </Tabs>

      {hasOpenaiKey && (
        <div className="flex flex-wrap gap-1">
          {LOGO_STYLES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStyle(s.value)}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                style === s.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={generateLogo}
        disabled={generating}
        className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md border border-dashed border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-[12px] text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? <Loader2Icon className="size-3.5 animate-spin" /> : <SparklesIcon className="size-3.5" />}
        {generating ? "Generating…" : hasOpenaiKey ? "Generate with AI" : "Generate with AI — add OpenAI key first"}
      </button>
    </div>
  );
}
