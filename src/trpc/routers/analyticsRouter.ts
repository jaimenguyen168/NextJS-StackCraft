import { z } from "zod";
import { createTRPCRouter, authProcedure } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { TRPCError } from "@trpc/server";

export const analyticsRouter = createTRPCRouter({
  getProjectData: authProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
        include: {
          contentBlocks: {
            select: {
              id: true,
              kind: true,
              type: true,
              sectionId: true,
              createdAt: true,
            },
            orderBy: { createdAt: "asc" },
          },
          sections: {
            orderBy: { order: "asc" },
            select: { id: true, title: true, parentId: true, order: true },
          },
          collaborators: {
            select: { id: true, role: true, status: true, createdAt: true },
          },
          images: { select: { id: true } },
          links: { select: { id: true } },
          chats: {
            include: {
              messages: {
                select: { id: true, role: true, content: true, createdAt: true, tokensUsed: true },
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      });

      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      return {
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
          published: project.published,
          githubUrl: project.githubUrl,
          tags: project.tags,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        },
        contentBlocks: project.contentBlocks,
        sections: project.sections,
        collaborators: project.collaborators,
        imageCount: project.images.length,
        linkCount: project.links.length,
        chatMessages: project.chats.flatMap((c) => c.messages),
      };
    }),
});
