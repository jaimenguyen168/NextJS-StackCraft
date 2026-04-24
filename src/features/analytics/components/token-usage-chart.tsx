"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import type { ChatMessage } from "@/features/analytics/types";

const tokenConfig = {
  tokens: { label: "Tokens", color: "var(--chart-1)" },
} satisfies ChartConfig;

function fmtTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface TokenUsageChartProps {
  messages: ChatMessage[];
}

export function TokenUsageChart({ messages }: TokenUsageChartProps) {
  const allDays = useMemo(() => {
    return eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    }).map((day) => {
      const dayStart = startOfDay(day).getTime();
      const dayEnd = dayStart + 86_400_000;
      const tokens = messages
        .filter((m) => {
          const t = new Date(m.createdAt).getTime();
          return t >= dayStart && t < dayEnd;
        })
        .reduce((sum, m) => sum + (m.tokensUsed ?? 0), 0);
      return { date: format(day, "MMM d"), tokens };
    });
  }, [messages]);

  // Trim to active window ± 2 days so the chart isn't mostly empty
  const data = useMemo(() => {
    let first = allDays.findIndex((d) => d.tokens > 0);
    let last = allDays.findLastIndex((d) => d.tokens > 0);
    if (first === -1) return allDays.slice(-14);
    first = Math.max(0, first - 2);
    last = Math.min(allDays.length - 1, last + 2);
    return allDays.slice(first, last + 1);
  }, [allDays]);

  const totalTokens = allDays.reduce((s, d) => s + d.tokens, 0);
  const hasActivity = totalTokens > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Daily Token Usage</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasActivity
              ? `${fmtTokens(totalTokens)} tokens used over the last 30 days`
              : "No token usage yet for this project"}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={tokenConfig} className="h-[200px] w-full">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <CartesianGrid vertical={false} className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "currentColor" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "currentColor" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={fmtTokens}
              className="text-muted-foreground"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [fmtTokens(Number(value)), "Tokens"]}
                />
              }
            />
            <Bar
              dataKey="tokens"
              fill="var(--color-tokens)"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
