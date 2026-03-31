import { useTRPC } from "@/trpc/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const useCheckManualCredit = () => {
  const trpc = useTRPC();
  const { data: usage } = useQuery(trpc.usage.getUsage.queryOptions());

  return {
    allowed: usage ? usage.manualCredits.remaining > 0 : true,
    used: usage?.manualCredits.used ?? 0,
    limit: usage?.manualCredits.limit ?? 0,
    remaining: usage?.manualCredits.remaining ?? 0,
  };
};

export function useCheckGithubCredit() {
  const trpc = useTRPC();
  const { data: usage } = useQuery(trpc.usage.getUsage.queryOptions());

  return {
    allowed: usage ? usage.githubCredits.remaining > 0 : true,
    used: usage?.githubCredits.used ?? 0,
    limit: usage?.githubCredits.limit ?? 0,
    remaining: usage?.githubCredits.remaining ?? 0,
  };
}

export function useCheckEditTokens() {
  const trpc = useTRPC();
  const { data: usage } = useQuery(trpc.usage.getUsage.queryOptions());

  return {
    allowed: usage
      ? usage.editTokens.remaining === Infinity ||
        usage.editTokens.remaining > 0
      : true,
    used: usage?.editTokens.used ?? 0,
    limit: usage?.editTokens.limit ?? 0,
    remaining: usage?.editTokens.remaining ?? 0,
  };
}

export const useInvalidateUsage = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.usage.getUsage.queryKey(),
    });
  };
};
