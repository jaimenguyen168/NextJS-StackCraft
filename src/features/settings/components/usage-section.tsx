"use client";

import { ZapIcon, PencilIcon, SparklesIcon, RefreshCwIcon } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSubscriptions } from "@/trpc/hooks/use-subscriptions";
import Link from "next/link";

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

function getNextReset(periodStart: string | Date): string {
  const period = new Date(periodStart);
  const nextReset = new Date(period);
  nextReset.setMonth(nextReset.getMonth() + 1);
  return nextReset.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Metric row ───────────────────────────────────────────────────────────────

function MetricRow({
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground tabular-nums">
          {isUnlimited ? (
            <span className="text-green-500 font-medium">Unlimited</span>
          ) : (
            <>
              <span className="text-foreground font-medium">{formatTokens(used)}</span>
              {" / "}
              {formatTokens(limit)}
            </>
          )}
        </span>
      </div>

      {!isUnlimited && (
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              getProgressColor(percent),
            )}
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
      )}

      {!isUnlimited && (
        <p className="text-xs text-muted-foreground">
          {Math.max(0, limit - used)} remaining
        </p>
      )}
    </div>
  );
}

// ─── Upgrade banner ───────────────────────────────────────────────────────────

function UpgradeBanner({ isPro }: { isPro: boolean }) {
  if (isPro) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-primary/20 bg-primary/5">
      <div>
        <p className="text-sm font-medium">Need more capacity?</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Upgrade your plan for higher limits or unlimited usage.
        </p>
      </div>
      <Link href="/pricing" className="shrink-0">
        <Button size="sm">
          <SparklesIcon className="size-3" />
          Upgrade
        </Button>
      </Link>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function UsageSection() {
  const { isLoading, usage, planLabel, isFree, isPro } = useSubscriptions();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Usage</h2>
        <p className="text-sm text-muted-foreground mt-1">
          View your current usage and monthly limits.
        </p>
      </div>

      {isLoading || !usage ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2Icon className="size-4 animate-spin" />
          Loading usage...
        </div>
      ) : (
        <>
          {/* Upgrade banner (only if not on PRO) */}
          <UpgradeBanner isPro={isPro} />

          {/* Metrics */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">This month&apos;s usage</h3>

            <div className="rounded-lg border border-border p-5 space-y-6">
              {/* Plan badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {planLabel} Plan
                </span>
                {!isFree && (
                  <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>

              <div className="space-y-5">
                <MetricRow
                  icon={ZapIcon}
                  label="Manual generates"
                  used={usage.manualCredits.used}
                  limit={usage.manualCredits.limit}
                  percent={usage.manualCredits.percent}
                />
                <MetricRow
                  icon={FaGithub}
                  label="GitHub imports"
                  used={usage.githubCredits.used}
                  limit={usage.githubCredits.limit}
                  percent={usage.githubCredits.percent}
                />
                <MetricRow
                  icon={PencilIcon}
                  label="Edit tokens"
                  used={usage.editTokens.used}
                  limit={usage.editTokens.limit as number}
                  percent={usage.editTokens.percent}
                />
              </div>

              {/* Reset info */}
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <RefreshCwIcon className="size-3.5 text-muted-foreground shrink-0" />
                {isFree ? (
                  <p className="text-xs text-muted-foreground">
                    Usage resets at the start of each calendar month.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Resets on{" "}
                    <span className="text-foreground font-medium">
                      {getNextReset(usage.periodStart)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
