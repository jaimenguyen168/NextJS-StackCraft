import Link from "next/link";
import { SparklesIcon, UserIcon, ExternalLinkIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/features/analytics/types";

interface ChatHistoryListProps {
  messages: ChatMessage[];
  projectId: string;
}

export function ChatHistoryList({ messages, projectId }: ChatHistoryListProps) {
  if (messages.length === 0) {
    return (
      <p className="text-xs text-muted-foreground px-2 py-6 text-center">
        No chat messages yet for this project.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {messages.map((msg) => {
        const isAssistant = msg.role === "ASSISTANT";

        return (
          <Link
            key={msg.id}
            href={`/projects/${projectId}?messageId=${msg.id}&history=1`}
            className={cn(
              "group flex gap-2 px-2 py-2 rounded-lg border border-transparent",
              "hover:bg-muted/60 hover:border-border transition-all duration-150",
            )}
          >
            {isAssistant ? (
              <SparklesIcon className="size-3 shrink-0 mt-0.5 text-primary/70" />
            ) : (
              <UserIcon className="size-3 shrink-0 mt-0.5 text-muted-foreground/80" />
            )}
            <div className="space-y-0.5 min-w-0 flex-1">
              <p
                className={cn(
                  "leading-relaxed text-[12px]",
                  isAssistant ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {msg.content}
              </p>
              <p className="text-[10px] text-muted-foreground/80">
                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
              </p>
            </div>
            <ExternalLinkIcon className="size-3 shrink-0 mt-0.5 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-colors" />
          </Link>
        );
      })}
    </div>
  );
}
