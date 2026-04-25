"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckIcon, EyeIcon, EyeOffIcon, Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useMe, useSetOpenaiKey, useRemoveOpenaiKey } from "@/trpc/hooks/use-users";

// ─── Row wrapper ──────────────────────────────────────────────────────────────

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-4 py-5 border-b border-border last:border-0">
      <div className="sm:w-48 shrink-0">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ─── OpenAI key field ─────────────────────────────────────────────────────────

function OpenAIKeyField({ hasKey }: { hasKey: boolean }) {
  const [draft, setDraft] = useState("");
  const [show, setShow] = useState(false);
  const setKey = useSetOpenaiKey();
  const removeKey = useRemoveOpenaiKey();

  return (
    <div className="space-y-2 max-w-sm">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            type={show ? "text" : "password"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                setKey.mutate({ key: draft.trim() }, { onSuccess: () => { toast.success("OpenAI key saved"); setDraft(""); } });
              }
            }}
            className="h-9 pr-9 focus-visible:ring-0"
            placeholder={hasKey ? "Key saved — paste new one to replace" : "sk-..."}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {show ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        </div>
        {draft.trim() && (
          <Button
            size="sm"
            onClick={() => setKey.mutate({ key: draft.trim() }, { onSuccess: () => { toast.success("OpenAI key saved"); setDraft(""); } })}
            disabled={setKey.isPending}
          >
            {setKey.isPending ? <Loader2Icon className="size-3 animate-spin" /> : <CheckIcon className="size-3" />}
            Save
          </Button>
        )}
        {hasKey && !draft.trim() && (
          <Button
            size="sm"
            variant="outline"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => removeKey.mutate(undefined, { onSuccess: () => toast.success("OpenAI key removed") })}
            disabled={removeKey.isPending}
          >
            {removeKey.isPending ? <Loader2Icon className="size-3 animate-spin" /> : <Trash2Icon className="size-3" />}
            Remove
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {hasKey ? "✓ Key is saved and encrypted." : "Your key is encrypted at rest and never shared."}{" "}
        <a
          href="https://platform.openai.com/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground transition-colors"
        >
          Get a key →
        </a>
      </p>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function AiSection() {
  const { user } = useMe();

  return (
    <div className="space-y-1">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">AI</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your own AI API keys. Keys are encrypted and only used on your behalf.
        </p>
      </div>

      <SettingRow
        label="OpenAI"
        description="Used for logo generation (gpt-image-1). ~$0.04 per image."
      >
        <OpenAIKeyField hasKey={user?.hasOpenaiKey ?? false} />
      </SettingRow>
    </div>
  );
}
