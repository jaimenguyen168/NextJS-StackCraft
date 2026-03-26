"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

const DashboardInputPanel = () => {
  const [text, setText] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const prompt = searchParams.get("prompt");
    if (prompt) setText(decodeURIComponent(prompt));
  }, [searchParams]);

  const create = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: async (project) => {
        queryClient.invalidateQueries(trpc.projects.getAll.queryOptions());

        // Navigate immediately
        router.push(`/projects/${project.id}`);

        // Fire generation in background
        fetch("/api/projects/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: project.id }),
        });
      },
    }),
  );

  const handleGenerate = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    create.mutate({
      name: "Untitled Project",
      description: trimmed,
    });
  };

  return (
    <div className="rounded-[22px] bg-linear-185 from-primary from-15% via-primary/50 via-50% to-muted to-85% p-0.5">
      <div className="rounded-[20px] bg-background p-1">
        <div className="space-y-4 rounded-2xl bg-background p-4">
          <Textarea
            placeholder="Describe your project idea... e.g. 'A SaaS platform for managing freelance invoices with Stripe billing and a client portal'"
            className="min-h-35 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex items-center justify-end">
            <span className="text-xs text-muted-foreground">
              {text.length} characters
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end p-3">
          <Button
            size="sm"
            disabled={!text.trim() || create.isPending}
            onClick={handleGenerate}
            className="w-full lg:w-auto"
          >
            <Sparkles className="size-4" />
            {create.isPending ? "Creating..." : "Generate blueprint"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardInputPanel;
