"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

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
