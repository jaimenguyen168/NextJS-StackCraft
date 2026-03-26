import { z } from "zod";
import { createTRPCRouter, authProcedure } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { TRPCError } from "@trpc/server";

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

  // add to projectsRouter in projects.ts
  updateName: authProcedure
    .input(z.object({ id: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.project.update({
        where: { id: input.id, userId: ctx.userId },
        data: { name: input.name },
      });
    }),

  updateDocument: authProcedure
    .input(z.object({ id: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const document = await prisma.document.findFirst({
        where: {
          id: input.id,
          project: { userId: ctx.userId },
        },
      });

      if (!document) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });
      }

      return prisma.document.update({
        where: { id: input.id },
        data: { content: input.content },
      });
    }),

  updateDiagram: authProcedure
    .input(z.object({ id: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const diagram = await prisma.diagram.findFirst({
        where: {
          id: input.id,
          project: { userId: ctx.userId },
        },
      });

      if (!diagram) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Diagram not found",
        });
      }

      return prisma.diagram.update({
        where: { id: input.id },
        data: { content: input.content },
      });
    }),
});
