"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  quickPrompts,
  type QuickPrompt,
} from "@/features/dashboard/data/quick-prompts";

const DashboardQuickPrompts = () => {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground tracking-wide">
        Try an example
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {quickPrompts.map((prompt) => (
          <QuickPromptCard key={prompt.title} {...prompt} />
        ))}
      </div>
    </div>
  );
};

export default DashboardQuickPrompts;

const QuickPromptCard = ({
  title,
  description,
  emoji,
  prompt,
}: QuickPrompt) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/dashboard/?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-border bg-card p-3 text-left",
        "transition-all duration-150 hover:border-primary/30 hover:bg-muted/40 hover:shadow-sm",
      )}
    >
      <span className="text-xl shrink-0 mt-0.5">{emoji}</span>
      <div className="space-y-0.5 min-w-0">
        <p className="text-[13px] font-medium tracking-tight text-foreground truncate">
          {title}
        </p>
        <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>
    </button>
  );
};
