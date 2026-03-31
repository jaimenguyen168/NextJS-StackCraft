"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import {
  PLAN_LABELS,
  PLAN_PRICES,
  type Plan,
} from "@/features/usage/constants/plans";

export function useSubscriptions() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(trpc.usage.getUsage.queryOptions());

  const plan = (data?.plan ?? "FREE") as Plan;

  return {
    isLoading,
    plan,
    planLabel: PLAN_LABELS[plan],
    planPrice: PLAN_PRICES[plan],
    isFree: plan === "FREE",
    isStarter: plan === "STARTER",
    isPro: plan === "PRO",
    usage: data ?? null,
  };
}
