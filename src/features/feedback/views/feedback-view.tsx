"use client";

import React, { useState } from "react";
import {
  BugIcon,
  LightbulbIcon,
  MessageSquareIcon,
  SendIcon,
  CheckCircle2Icon,
  Loader2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/page-header";

type FeedbackType = "bug" | "feature" | "general";

const TYPES: {
  value: FeedbackType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: "bug",
    label: "Bug Report",
    description: "Something isn't working",
    icon: BugIcon,
  },
  {
    value: "feature",
    label: "Feature Request",
    description: "Suggest an improvement",
    icon: LightbulbIcon,
  },
  {
    value: "general",
    label: "General Feedback",
    description: "Anything else on your mind",
    icon: MessageSquareIcon,
  },
];

export default function FeedbackView() {
  const [type, setType] = useState<FeedbackType>("general");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      setSubmitted(data.url);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to submit feedback",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setTitle("");
    setDescription("");
    setType("general");
    setSubmitted(null);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader title="Feedback" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 pt-6 lg:pt-8">
          {submitted ? (
            <div className="flex flex-col items-center gap-4 text-center py-12">
              <CheckCircle2Icon className="size-12 text-green-500" />
              <div>
                <h2 className="text-lg font-semibold">
                  Thanks for the feedback!
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Your submission was logged as a GitHub issue.
                </p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={submitted} target="_blank" rel="noopener noreferrer">
                    View issue →
                  </a>
                </Button>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Submit more
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Share your thoughts</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Found a bug or have an idea? We read every submission.
                </p>
              </div>

              {/* Type picker */}
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-center transition-colors",
                        type === t.value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border/60 text-muted-foreground hover:text-foreground hover:border-border bg-muted/20",
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="text-[12px] font-medium leading-tight">
                        {t.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground leading-tight hidden sm:block">
                        {t.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short summary of your feedback"
                  className="focus-visible:ring-0"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Give us as much detail as you like..."
                  rows={5}
                  className="resize-none focus-visible:ring-0"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={submitting || !title.trim() || !description.trim()}
              >
                {submitting ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <SendIcon className="size-4" />
                )}
                {submitting ? "Submitting…" : "Send Feedback"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
