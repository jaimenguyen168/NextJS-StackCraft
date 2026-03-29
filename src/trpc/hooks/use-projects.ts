import { useTRPC } from "@/trpc/client";
import {
  useMutation,
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
  const { data: project, ...rest } = useSuspenseQuery({
    ...trpc.projects.getById.queryOptions({ id: projectId }),
    refetchInterval: (query) =>
      query.state.data?.status === "GENERATING" ? 3000 : false,
  });
  return { project, ...rest };
}

export function useProjectBySlug(username: string, slug: string) {
  const trpc = useTRPC();
  const { data: project, ...rest } = useSuspenseQuery(
    trpc.projects.getBySlug.queryOptions({ username, slug }),
  );
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

export function useDeleteProject() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.delete.mutationOptions({
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

export function useUpdateProjectColor(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.updateColor.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        );
        queryClient.invalidateQueries(trpc.projects.getAll.queryOptions());
      },
    }),
  );
}

export function useUpdateProjectMainContent(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.updateMainContent.mutationOptions({
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

export function useUpdateProjectGithubUrl(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.updateGithubUrl.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        );
        queryClient.invalidateQueries(trpc.projects.getAll.queryOptions());
      },
    }),
  );
}

export function useUpdateProjectLogoUrl(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.updateLogoUrl.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        );
        queryClient.invalidateQueries(trpc.projects.getAll.queryOptions());
      },
    }),
  );
}

export function useAddProjectImage(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.addProjectImage.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        ),
    }),
  );
}

export function useDeleteProjectImage(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.deleteProjectImage.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        ),
    }),
  );
}

export function useUpdateProjectTags(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.updateTags.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        );
        queryClient.invalidateQueries(trpc.projects.getAll.queryOptions());
      },
    }),
  );
}

export function useUpdateProjectPublished(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.updatePublished.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        );
        queryClient.invalidateQueries(trpc.projects.getAll.queryOptions());
      },
    }),
  );
}

export function useAddProjectLink(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.addLink.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        );
      },
    }),
  );
}

export function useDeleteProjectLink(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.deleteLink.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        );
      },
    }),
  );
}

export function useInviteCollaborator(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.inviteCollaborator.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        );
      },
    }),
  );
}

export function useRemoveCollaborator(projectId: string) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.projects.removeCollaborator.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.projects.getById.queryOptions({ id: projectId }),
        );
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

export function useGetChat(projectId: string) {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.projects.getChat.queryOptions({ projectId }));
}

export function useInvalidateProject() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return async (projectId: string) => {
    await queryClient.refetchQueries({
      queryKey: trpc.projects.getById.queryKey({ id: projectId }),
    });
    await queryClient.invalidateQueries({
      queryKey: trpc.projects.getChat.queryKey({ projectId }),
    });
  };
}

export function useTogglePublish() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries(trpc.projects.getAll.queryOptions());

  const publish = useMutation(
    trpc.projects.publish.mutationOptions({ onSuccess: invalidate }),
  );
  const unpublish = useMutation(
    trpc.projects.unpublish.mutationOptions({ onSuccess: invalidate }),
  );

  const toggle = (
    id: string,
    published: boolean,
    callbacks?: { onSuccess?: () => void; onError?: () => void },
  ) => {
    const mutation = published ? publish : unpublish;
    mutation.mutate({ id }, callbacks);
  };

  return {
    toggle,
    isPending: publish.isPending || unpublish.isPending,
  };
}
