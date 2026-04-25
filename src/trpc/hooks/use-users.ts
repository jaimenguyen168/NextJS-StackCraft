"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useSearchUsers(query: string) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.users.search.queryOptions({ query }),
    enabled: query.length > 1,
  });
}

export function useMe() {
  const trpc = useTRPC();
  const { data: user, ...rest } = useSuspenseQuery(
    trpc.users.getMe.queryOptions(),
  );
  return { user, ...rest };
}

export function useSetOpenaiKey() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.users.setOpenaiKey.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(trpc.users.getMe.queryOptions()),
    }),
  );
}

export function useRemoveOpenaiKey() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.users.removeOpenaiKey.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries(trpc.users.getMe.queryOptions()),
    }),
  );
}

