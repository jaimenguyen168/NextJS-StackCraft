import { z } from "zod";
import { createTRPCRouter, authProcedure, publicProcedure } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { slugify } from "@/lib/utils";

// ─── Helper ───────────────────────────────────────────────────────────────────
async function getProjectSnapshot(projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId },
    include: {
      documents: { orderBy: { order: "asc" } },
      diagrams: { orderBy: { order: "asc" } },
    },
  });

  return {
    description: project?.description ?? "",
    documents:
      project?.documents.map((d) => ({
        id: d.id,
        title: d.title,
        type: d.type,
        content: d.content,
        order: d.order,
      })) ?? [],
    diagrams:
      project?.diagrams.map((d) => ({
        id: d.id,
        title: d.title,
        type: d.type,
        content: d.content,
        order: d.order,
      })) ?? [],
  };
}

async function getOrCreateChat(projectId: string) {
  let chat = await prisma.projectChat.findFirst({ where: { projectId } });
  if (!chat) chat = await prisma.projectChat.create({ data: { projectId } });
  return chat;
}

// ──────────────────────────────────────────────────────────────────────────────

export const projectsRouter = createTRPCRouter({
  create: authProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        username: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { username } = input;
      const baseSlug = slugify(input.name);
      let slug = baseSlug;
      let attempt = 1;
      while (
        await prisma.project.findUnique({
          where: { username_slug: { username, slug } },
        })
      ) {
        slug = `${baseSlug}-${attempt++}`;
      }
      return prisma.project.create({
        data: {
          userId: ctx.userId,
          username,
          name: input.name,
          description: input.description,
          slug,
        },
      });
    }),

  publish: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.project.update({
        where: { id: input.id, userId: ctx.userId },
        data: { published: true },
      });
    }),

  unpublish: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.project.update({
        where: { id: input.id, userId: ctx.userId },
        data: { published: false },
      });
    }),

  getAll: authProcedure.query(async ({ ctx }) => {
    return prisma.project.findMany({
      where: { userId: ctx.userId },
      include: {
        diagrams: { orderBy: { order: "asc" } },
        documents: { orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: authProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return prisma.project.findFirst({
        where: { id: input.id, userId: ctx.userId },
        include: {
          diagrams: { orderBy: { order: "asc" } },
          documents: { orderBy: { order: "asc" } },
        },
      });
    }),

  getBySlug: publicProcedure
    .input(z.object({ username: z.string(), slug: z.string() }))
    .query(async ({ input }) => {
      return prisma.project.findUnique({
        where: {
          username_slug: { username: input.username, slug: input.slug },
          published: true,
        },
        include: {
          documents: { orderBy: { order: "asc" } },
          diagrams: { orderBy: { order: "asc" } },
        },
      });
    }),

  delete: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return prisma.project.delete({
        where: { id: input.id, userId: ctx.userId },
      });
    }),

  updateName: authProcedure
    .input(z.object({ id: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.id, userId: ctx.userId },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const baseSlug = slugify(input.name);
      let slug = baseSlug;
      let attempt = 1;
      while (
        await prisma.project.findUnique({
          where: {
            username_slug: { username: project.username, slug },
            NOT: { id: input.id },
          },
        })
      ) {
        slug = `${baseSlug}-${attempt++}`;
      }

      return prisma.project.update({
        where: { id: input.id, userId: ctx.userId },
        data: { name: input.name, slug },
      });
    }),

  updateDocument: authProcedure
    .input(z.object({ id: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const document = await prisma.document.findFirst({
        where: { id: input.id, project: { userId: ctx.userId } },
      });
      if (!document)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Document not found",
        });

      const updated = await prisma.document.update({
        where: { id: input.id },
        data: { content: input.content },
      });

      const chat = await getOrCreateChat(document.projectId);
      const projectState = await getProjectSnapshot(document.projectId);

      await prisma.chatMessage.create({
        data: {
          chatId: chat.id,
          role: "USER",
          content: `Manually edited "${document.title}"`,
          snapshot: { projectState },
        },
      });

      return updated;
    }),

  updateDiagram: authProcedure
    .input(z.object({ id: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const diagram = await prisma.diagram.findFirst({
        where: { id: input.id, project: { userId: ctx.userId } },
      });
      if (!diagram)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Diagram not found",
        });

      const updated = await prisma.diagram.update({
        where: { id: input.id },
        data: { content: input.content },
      });

      const chat = await getOrCreateChat(diagram.projectId);
      const projectState = await getProjectSnapshot(diagram.projectId);

      await prisma.chatMessage.create({
        data: {
          chatId: chat.id,
          role: "USER",
          content: `Manually edited "${diagram.title}"`,
          snapshot: { projectState },
        },
      });

      return updated;
    }),

  deleteDocument: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const document = await prisma.document.findFirst({
        where: { id: input.id, project: { userId: ctx.userId } },
      });
      if (!document) throw new TRPCError({ code: "NOT_FOUND" });

      await prisma.document.delete({ where: { id: input.id } });

      const chat = await getOrCreateChat(document.projectId);
      const projectState = await getProjectSnapshot(document.projectId);

      await prisma.chatMessage.create({
        data: {
          chatId: chat.id,
          role: "USER",
          content: `Deleted "${document.title}"`,
          snapshot: { projectState },
        },
      });

      return { id: input.id };
    }),

  deleteDiagram: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const diagram = await prisma.diagram.findFirst({
        where: { id: input.id, project: { userId: ctx.userId } },
      });
      if (!diagram) throw new TRPCError({ code: "NOT_FOUND" });

      await prisma.diagram.delete({ where: { id: input.id } });

      const chat = await getOrCreateChat(diagram.projectId);
      const projectState = await getProjectSnapshot(diagram.projectId);

      await prisma.chatMessage.create({
        data: {
          chatId: chat.id,
          role: "USER",
          content: `Deleted "${diagram.title}"`,
          snapshot: { projectState },
        },
      });

      return { id: input.id };
    }),

  getChat: authProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });
      if (!project) return [];

      const chat = await prisma.projectChat.findFirst({
        where: { projectId: input.projectId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      return chat?.messages ?? [];
    }),

  restore: authProcedure
    .input(
      z.object({
        projectId: z.string(),
        snapshot: z.object({
          description: z.string().optional(),
          documents: z.array(
            z.object({
              id: z.string(),
              title: z.string(),
              content: z.string(),
              type: z.string(),
              order: z.number(),
            }),
          ),
          diagrams: z.array(
            z.object({
              id: z.string(),
              title: z.string(),
              content: z.string(),
              type: z.string(),
              order: z.number(),
            }),
          ),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
        include: { documents: true, diagrams: true },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const snapshotDocIds = new Set(input.snapshot.documents.map((d) => d.id));
      const snapshotDiagramIds = new Set(
        input.snapshot.diagrams.map((d) => d.id),
      );
      const currentDocIds = new Set(project.documents.map((d) => d.id));
      const currentDiagramIds = new Set(project.diagrams.map((d) => d.id));

      await Promise.all([
        // Delete docs/diagrams not in snapshot
        ...project.documents
          .filter((d) => !snapshotDocIds.has(d.id))
          .map((d) => prisma.document.delete({ where: { id: d.id } })),
        ...project.diagrams
          .filter((d) => !snapshotDiagramIds.has(d.id))
          .map((d) => prisma.diagram.delete({ where: { id: d.id } })),

        // Update existing docs/diagrams
        ...input.snapshot.documents
          .filter((d) => currentDocIds.has(d.id))
          .map((d) =>
            prisma.document.update({
              where: { id: d.id },
              data: { content: d.content, title: d.title, order: d.order },
            }),
          ),
        ...input.snapshot.diagrams
          .filter((d) => currentDiagramIds.has(d.id))
          .map((d) =>
            prisma.diagram.update({
              where: { id: d.id },
              data: { content: d.content, title: d.title, order: d.order },
            }),
          ),

        // Recreate deleted docs/diagrams
        ...input.snapshot.documents
          .filter((d) => !currentDocIds.has(d.id))
          .map((d) =>
            prisma.document.create({
              data: {
                id: d.id,
                projectId: input.projectId,
                title: d.title,
                content: d.content,
                type: d.type as string,
                order: d.order,
              },
            }),
          ),
        ...input.snapshot.diagrams
          .filter((d) => !currentDiagramIds.has(d.id))
          .map((d) =>
            prisma.diagram.create({
              data: {
                id: d.id,
                projectId: input.projectId,
                title: d.title,
                content: d.content,
                type: d.type as string,
                order: d.order,
              },
            }),
          ),
      ]);

      const chat = await getOrCreateChat(input.projectId);
      const projectState = await getProjectSnapshot(input.projectId);

      await prisma.chatMessage.create({
        data: {
          chatId: chat.id,
          role: "USER",
          content: "Restored project to a previous snapshot",
          snapshot: { projectState },
        },
      });

      return { ok: true };
    }),
});
