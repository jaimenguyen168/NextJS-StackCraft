"use client";

import { useState, useEffect, Suspense } from "react";
import {
  SendIcon,
  HistoryIcon,
  ListIcon,
  Loader2Icon,
  SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ProjectOutline } from "@/features/projects/components/project-outline";
import { ProjectSettings } from "@/features/projects/components/project-settings";
import { ProjectHistory } from "@/features/projects/components/project-history";
import { useInvalidateProject, useProject } from "@/trpc/hooks/use-projects";
import { useInvalidateUsage } from "@/trpc/hooks/use-usage";
import { useProjectSnapshot } from "@/features/projects/contexts/project-snapshot-context";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";

export default function ProjectChatPanel() {
  const { projectId } = useProjectSnapshot();
  const { project } = useProject(projectId);
  const invalidateProject = useInvalidateProject();
  const invalidateUsage = useInvalidateUsage();

  const [navOpen, setNavOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const p = searchParams.get("prompt");
    if (p) {
      setPrompt(decodeURIComponent(p));
      router.replace(`/projects/${projectId}`, { scroll: false });
    }
  }, [searchParams]);

  // Auto-open history drawer on mobile when navigating from analytics with ?history=1
  useEffect(() => {
    if (searchParams.get("history") === "1") {
      setHistoryOpen(true);
    }
  }, [searchParams]);

  const handleScrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setNavOpen(false);
  };

  const handleSend = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/projects/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, prompt: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }

      toast.success(data.message);
      setPrompt("");

      await Promise.all([invalidateProject(projectId), invalidateUsage()]);
    } catch {
      toast.error("Failed to send edit request");
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  return (
    <div className="shrink-0">
      <div className="p-3 space-y-2">
        <div className="relative">
          <Textarea
            placeholder="Ask AI to edit or improve any section..."
            className="min-h-36 max-h-60 overflow-y-auto resize-none text-sm border-border/60 bg-muted/30 focus-visible:ring-0 focus-visible:border-primary/50 pr-3 pb-10 lg:pb-10"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="sm"
            className="absolute bottom-2 right-2 hidden lg:flex px-3"
            onClick={handleSend}
            disabled={!prompt.trim() || loading}
          >
            {loading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <SendIcon className="size-4" />
            )}
            {loading ? "Editing..." : "Send"}
          </Button>
        </div>

        <div className="flex items-center justify-between py-1 lg:hidden">
          <div className="flex items-center gap-2">
            {/* Outline */}
            <Drawer open={navOpen} onOpenChange={setNavOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm">
                  <ListIcon className="size-4" />
                  Outline
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Outline</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto max-h-[60vh]">
                  <ProjectOutline
                    onScrollToAction={handleScrollTo}
                    onCloseAction={() => setNavOpen(false)}
                  />
                </div>
              </DrawerContent>
            </Drawer>

            {/* History */}
            <Drawer open={historyOpen} onOpenChange={setHistoryOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm">
                  <HistoryIcon className="size-4" />
                  History
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>History</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto max-h-[60vh] p-3">
                  <Suspense fallback={null}>
                    <ProjectHistory projectId={projectId} />
                  </Suspense>
                </div>
              </DrawerContent>
            </Drawer>

            {/* Settings */}
            <Drawer open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DrawerTrigger asChild>
                <Button variant="outline" size="sm">
                  <SettingsIcon className="size-4" />
                  Settings
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Settings</DrawerTitle>
                </DrawerHeader>
                <div className="overflow-y-auto max-h-[60vh]">
                  <ProjectSettings />
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          <Button
            size="sm"
            className="ml-auto px-5"
            onClick={handleSend}
            disabled={!prompt.trim() || loading}
          >
            {loading ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <SendIcon className="size-4" />
            )}
            {loading ? "Editing..." : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
