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

export function useUpdateProjectName(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.updateName.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        );
        queryClient.invalidateQueries(trpc.projects.getAll.queryOptions());
      },
    }),
  );
}

export function useUpdateBlock(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.updateBlock.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        );
        queryClient.invalidateQueries(
          trpc.projects.getChat.queryOptions({ projectId }),
        );
      },
    }),
  );
}

export function useDeleteBlock(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.deleteBlock.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        );
        queryClient.invalidateQueries(
          trpc.projects.getChat.queryOptions({ projectId }),
        );
      },
    }),
  );
}

export function useCreateSection(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.createSection.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        ),
    }),
  );
}

export function useUpdateSection(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.updateSection.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        ),
    }),
  );
}

export function useDeleteSection(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.deleteSection.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        ),
    }),
  );
}

export function useAssignBlockToSection(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.assignBlockToSection.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        );
        queryClient.invalidateQueries(
          trpc.projects.getChat.queryOptions({ projectId }),
        );
      },
    }),
  );
}

export function useRestoreProject(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.restore.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        );
        queryClient.invalidateQueries(
          trpc.projects.getChat.queryOptions({ projectId }),
        );
      },
    }),
  );
}
