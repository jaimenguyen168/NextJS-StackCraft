import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

export function useProjects() {
  const trpc = useTRPC();
  const { data: projects, ...rest } = useSuspenseQuery(
    trpc.projects.getAll.queryOptions(),
  );
  return { projects, ...rest };
}

export function useProject(projectId: string) {
  const trpc = useTRPC();
  const { data: project, ...rest } = useQuery({
    ...trpc.projects.getById.queryOptions({ id: projectId }),
    refetchInterval: (query) =>
      query.state.data?.status === "GENERATING" ? 3000 : false,
  });
  return { project, ...rest };
}

export function useCreateProject() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.projects.getAll.queryOptions());
      },
    }),
  );
}
