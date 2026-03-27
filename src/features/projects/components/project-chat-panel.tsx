"use client";

import { useState, useEffect } from "react";
import { SendIcon, HistoryIcon, ListIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ProjectOutline, ProjectHistoryContent } from "./project-outline";
import { useTRPC } from "@/trpc/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";

interface ProjectChatPanelProps {
  project: {
    id: string;
    name: string;
    documents: { id: string; title: string; content: string }[];
    diagrams: { id: string; title: string; content: string }[];
  };
}

export default function ProjectChatPanel({ project }: ProjectChatPanelProps) {
  const [navOpen, setNavOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const syncPrompt = () => {
      const p = searchParams.get("prompt");
      if (p) {
        setPrompt(decodeURIComponent(p));
        // Clear the param from URL without navigation
        router.replace(`/projects/${project.id}`, { scroll: false });
      }
    };
    syncPrompt();
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
        body: JSON.stringify({ projectId: project.id, prompt: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }

      toast.success(data.message);
      setPrompt("");

      await queryClient.refetchQueries({
        queryKey: trpc.projects.getById.queryKey({ id: project.id }),
      });
    } catch {
      toast.error("Failed to send edit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shrink-0">
      <div className="p-3 space-y-2">
        <Textarea
          placeholder="Ask AI to edit or improve any section..."
          className="min-h-28 resize-none text-sm border-border/60 bg-muted/30 focus-visible:ring-0 focus-visible:border-primary/50"
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
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-3 lg:hidden">
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
                    project={project}
                    onScrollToAction={handleScrollTo}
                    onCloseAction={() => setNavOpen(false)}
                  />
                </div>
              </DrawerContent>
            </Drawer>

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
                  <ProjectHistoryContent />
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
