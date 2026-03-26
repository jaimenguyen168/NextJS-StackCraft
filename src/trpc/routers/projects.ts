import { z } from "zod";
import { createTRPCRouter, authProcedure } from "@/trpc/init";
import { prisma } from "@/lib/db";

export const projectsRouter = createTRPCRouter({
  // Create a test project
  create: authProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return prisma.project.create({
        data: {
          userId: ctx.userId,
          name: input.name,
          description: input.description,
        },
      });
    }),

  // Get all projects for current user
  getAll: authProcedure.query(async ({ ctx }) => {
    return prisma.project.findMany({
      where: { userId: ctx.userId },
      include: { diagrams: true, documents: true },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get single project by id
  getById: authProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return prisma.project.findFirst({
        where: { id: input.id, userId: ctx.userId },
        include: { diagrams: true, documents: true },
      });
    }),

  // Delete a project
  delete: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.project.delete({
        where: { id: input.id, userId: ctx.userId },
      });
    }),
});
