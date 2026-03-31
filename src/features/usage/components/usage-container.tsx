"use client";

import { useEffect, useState } from "react";
import { Loader2Icon, ZapIcon, SparklesIcon } from "lucide-react";

import { PencilIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UpgradeDialog } from "@/features/usage/components/upgrade-dialog";
import { cn } from "@/lib/utils";
import { FaGithub } from "react-icons/fa";
import { useSubscriptions } from "@/trpc/hooks/use-subscriptions";
import Link from "next/link";
import { useSidebar } from "@/components/ui/sidebar";
import { useSession } from "@clerk/nextjs";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTokens(n: number): string {
  if (n === Infinity) return "∞";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function getProgressColor(percent: number): string {
  if (percent >= 90) return "bg-destructive";
  if (percent >= 70) return "bg-amber-500";
  return "bg-primary";
}

// ─── Usage row ────────────────────────────────────────────────────────────────

function UsageRow({
  icon: Icon,
  label,
  used,
  limit,
  percent,
}: {
  icon: React.ElementType;
  label: string;
  used: number;
  limit: number;
  percent: number;
}) {
  const isUnlimited = limit === Infinity;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="size-3 text-muted-foreground shrink-0" />
          <span className="text-[11px] text-muted-foreground">{label}</span>
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {isUnlimited ? (
            <span className="text-green-500">Unlimited</span>
          ) : (
            `${formatTokens(used)} / ${formatTokens(limit)}`
          )}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              getProgressColor(percent),
            )}
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Free tier widget ─────────────────────────────────────────────────────────

function FreeTierWidget() {
  const { usage } = useSubscriptions();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (!usage) return null;

  const allExhausted =
    usage.manualCredits.remaining === 0 && usage.githubCredits.remaining === 0;

  return (
    <>
      <div className="rounded-lg border border-border bg-background p-3 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Free Plan
          </p>
          {allExhausted && (
            <span className="text-[10px] text-destructive font-medium">
              Limit reached
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          <UsageRow
            icon={ZapIcon}
            label="Generates"
            used={usage.manualCredits.used}
            limit={usage.manualCredits.limit}
            percent={usage.manualCredits.percent}
          />
          <UsageRow
            icon={FaGithub}
            label="GitHub imports"
            used={usage.githubCredits.used}
            limit={usage.githubCredits.limit}
            percent={usage.githubCredits.percent}
          />
          <UsageRow
            icon={PencilIcon}
            label="Edit tokens"
            used={usage.editTokens.used}
            limit={usage.editTokens.limit as number}
            percent={usage.editTokens.percent}
          />
        </div>

        <Link href="/pricing">
          <Button
            size="sm"
            className="w-full h-7 text-[12px] gap-1.5"
            // onClick={() => setUpgradeOpen(true)}
          >
            <SparklesIcon className="size-3" />
            Upgrade plan
          </Button>
        </Link>

        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Resets monthly
        </p>
      </div>

      <UpgradeDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </>
  );
}

// ─── Paid tier widget ─────────────────────────────────────────────────────────

function PaidTierWidget() {
  const { usage, planLabel } = useSubscriptions();

  if (!usage) return null;

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {planLabel} Plan
        </p>
        <span className="text-[10px] text-green-500 font-medium">Active</span>
      </div>

      <div className="space-y-2.5">
        <UsageRow
          icon={ZapIcon}
          label="Generates"
          used={usage.manualCredits.used}
          limit={usage.manualCredits.limit}
          percent={usage.manualCredits.percent}
        />
        <UsageRow
          icon={FaGithub}
          label="GitHub imports"
          used={usage.githubCredits.used}
          limit={usage.githubCredits.limit}
          percent={usage.githubCredits.percent}
        />
        <UsageRow
          icon={PencilIcon}
          label="Edit tokens"
          used={usage.editTokens.used}
          limit={usage.editTokens.limit as number}
          percent={usage.editTokens.percent}
        />
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        {(() => {
          const period = new Date(usage.periodStart);
          const nextReset = new Date(period);
          nextReset.setMonth(nextReset.getMonth() + 1);
          return `Resets ${nextReset.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        })()}
      </p>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function UsageContainer() {
  const { isLoading, isFree } = useSubscriptions();
  const { open } = useSidebar();
  const { session } = useSession();

  useEffect(() => {
    const handleFocus = () => {
      session?.reload();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [session]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background p-3 flex items-center justify-center h-[100px]">
        <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return open ? isFree ? <FreeTierWidget /> : <PaidTierWidget /> : null;
}
