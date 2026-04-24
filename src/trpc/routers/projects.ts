import { z } from "zod";
import { createTRPCRouter, authProcedure, publicProcedure } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { slugify } from "@/lib/utils";
import { deleteImage } from "@/lib/r2";

export async function getProjectSnapshot(projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId },
    include: {
      contentBlocks: { orderBy: { order: "asc" } },
      sections: {
        where: { parentId: null },
        orderBy: { order: "asc" },
        include: { children: { orderBy: { order: "asc" } } },
      },
    },
  });

  return {
    name: project?.name ?? "",
    description: project?.description ?? "",
    mainColorLight: project?.mainColorLight ?? null,
    mainColorDark: project?.mainColorDark ?? null,
    mainContent: project?.mainContent ?? null,
    logoUrl: project?.logoUrl ?? null,
    githubUrl: project?.githubUrl ?? null,
    contentBlocks:
      project?.contentBlocks.map((b) => ({
        id: b.id,
        kind: b.kind,
        type: b.type,
        title: b.title,
        content: b.content,
        body: b.body,
        order: b.order,
        sectionId: b.sectionId,
      })) ?? [],
    sections:
      project?.sections.map((s) => ({
        id: s.id,
        title: s.title,
        order: s.order,
        parentId: s.parentId,
        children: s.children.map((c) => ({
          id: c.id,
          title: c.title,
          order: c.order,
          parentId: c.parentId,
        })),
      })) ?? [],
  };
}

async function getOrCreateChat(projectId: string) {
  let chat = await prisma.projectChat.findFirst({ where: { projectId } });
  if (!chat) chat = await prisma.projectChat.create({ data: { projectId } });
  return chat;
}

const snapshotSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  mainColorLight: z.string().nullable().optional(),
  mainColorDark: z.string().nullable().optional(),
  mainContent: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  githubUrl: z.string().nullable().optional(),
  contentBlocks: z.array(
    z.object({
      id: z.string(),
      kind: z.string(),
      type: z.string(),
      title: z.string(),
      content: z.string(),
      body: z.string().nullable().optional(),
      order: z.number(),
      sectionId: z.string().nullable().optional(),
    }),
  ),
  sections: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        order: z.number(),
        parentId: z.string().nullable().optional(),
        children: z
          .array(
            z.object({
              id: z.string(),
              title: z.string(),
              order: z.number(),
              parentId: z.string().nullable().optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});

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
      include: { contentBlocks: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  getById: authProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return prisma.project.findFirst({
        where: { id: input.id, userId: ctx.userId },
        include: {
          contentBlocks: { orderBy: { order: "asc" } },
          sections: {
            where: { parentId: null },
            orderBy: { order: "asc" },
            include: { children: { orderBy: { order: "asc" } } },
          },
          links: { orderBy: { order: "asc" } },
          collaborators: {
            include: { user: true },
            orderBy: { createdAt: "asc" },
          },
          images: { orderBy: { order: "asc" } },
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
          contentBlocks: { orderBy: { order: "asc" } },
          sections: {
            where: { parentId: null },
            orderBy: { order: "asc" },
            include: { children: { orderBy: { order: "asc" } } },
          },
          collaborators: {
            include: { user: true },
            orderBy: { createdAt: "asc" },
          },
          images: { orderBy: { order: "asc" } },
        },
      });
    }),

  delete: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Fetch all R2-stored images before deleting so we can clean up storage
        const images = await prisma.projectImage.findMany({
          where: { projectId: input.id, project: { userId: ctx.userId } },
          select: { key: true },
        });

        // Delete the project — DB cascades handle all related records
        const deleted = await prisma.project.delete({
          where: { id: input.id, userId: ctx.userId },
        });

        // Clean up R2 files after DB delete succeeds
        await Promise.allSettled(images.map((img) => deleteImage(img.key)));

        return deleted;
      } catch (err) {
        console.error("DELETE ERROR:", err);
        throw err;
      }
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
        where: { id: input.id },
        data: { name: input.name, slug },
      });
    }),

  updateColor: authProcedure
    .input(
      z.object({
        id: z.string(),
        mainColorLight: z.string().nullable(),
        mainColorDark: z.string().nullable(),
      }),
    )
    .mutation(({ ctx, input }) =>
      prisma.project.update({
        where: { id: input.id, userId: ctx.userId },
        data: {
          mainColorLight: input.mainColorLight,
          mainColorDark: input.mainColorDark,
        },
      }),
    ),

  updateMainContent: authProcedure
    .input(z.object({ id: z.string(), mainContent: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const updated = await prisma.project.update({
        where: { id: input.id, userId: ctx.userId },
        data: { mainContent: input.mainContent },
      });

      const chat = await getOrCreateChat(input.id);
      const projectState = await getProjectSnapshot(input.id);
      await prisma.chatMessage.create({
        data: {
          chatId: chat.id,
          role: "USER",
          content: "Manually edited main content",
          snapshot: { projectState },
        },
      });

      return updated;
    }),

  updateGithubUrl: authProcedure
    .input(z.object({ id: z.string(), githubUrl: z.string().nullable() }))
    .mutation(({ ctx, input }) =>
      prisma.project.update({
        where: { id: input.id, userId: ctx.userId },
        data: { githubUrl: input.githubUrl },
      }),
    ),

  updateGithubToken: authProcedure
    .input(z.object({ id: z.string(), githubToken: z.string().nullable() }))
    .mutation(({ ctx, input }) =>
      prisma.project.update({
        where: { id: input.id, userId: ctx.userId },
        data: { githubToken: input.githubToken },
      }),
    ),

  updateLogoUrl: authProcedure
    .input(z.object({ id: z.string(), logoUrl: z.string().nullable() }))
    .mutation(({ ctx, input }) =>
      prisma.project.update({
        where: { id: input.id, userId: ctx.userId },
        data: { logoUrl: input.logoUrl },
      }),
    ),

  updateTags: authProcedure
    .input(z.object({ id: z.string(), tags: z.array(z.string()) }))
    .mutation(({ ctx, input }) =>
      prisma.project.update({
        where: { id: input.id, userId: ctx.userId },
        data: { tags: input.tags },
      }),
    ),

  updatePublished: authProcedure
    .input(z.object({ id: z.string(), published: z.boolean() }))
    .mutation(({ ctx, input }) =>
      prisma.project.update({
        where: { id: input.id, userId: ctx.userId },
        data: { published: input.published },
      }),
    ),

  addLink: authProcedure
    .input(
      z.object({
        projectId: z.string(),
        label: z.string(),
        url: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
        include: { links: true },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      const maxOrder = Math.max(0, ...project.links.map((l) => l.order));
      return prisma.projectLink.create({
        data: {
          projectId: input.projectId,
          label: input.label,
          url: input.url,
          order: maxOrder + 1,
        },
      });
    }),

  deleteLink: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const link = await prisma.projectLink.findFirst({
        where: { id: input.id, project: { userId: ctx.userId } },
      });
      if (!link) throw new TRPCError({ code: "NOT_FOUND" });
      return prisma.projectLink.delete({ where: { id: input.id } });
    }),

  inviteCollaborator: authProcedure
    .input(z.object({ projectId: z.string(), username: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const user = await prisma.user.findUnique({
        where: { username: input.username },
      });
      if (!user)
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      return prisma.projectCollaborator.create({
        data: {
          projectId: input.projectId,
          userId: user.id,
          role: "VIEWER",
        },
      });
    }),

  removeCollaborator: authProcedure
    .input(z.object({ collaboratorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const collaborator = await prisma.projectCollaborator.findFirst({
        where: {
          id: input.collaboratorId,
          project: { userId: ctx.userId },
          role: { not: "OWNER" },
        },
      });
      if (!collaborator) throw new TRPCError({ code: "NOT_FOUND" });
      return prisma.projectCollaborator.delete({
        where: { id: input.collaboratorId },
      });
    }),

  // ─── Project Images ───────────────────────────────────────────────────────

  addProjectImage: authProcedure
    .input(
      z.object({
        projectId: z.string(),
        url: z.string(),
        key: z.string(),
        caption: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
        include: { images: true },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      const maxOrder = Math.max(0, ...project.images.map((i) => i.order));
      return prisma.projectImage.create({
        data: {
          projectId: input.projectId,
          url: input.url,
          key: input.key,
          caption: input.caption,
          order: maxOrder + 1,
        },
      });
    }),

  deleteProjectImage: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const image = await prisma.projectImage.findFirst({
        where: { id: input.id, project: { userId: ctx.userId } },
      });
      if (!image) throw new TRPCError({ code: "NOT_FOUND" });

      // Delete from R2
      await deleteImage(image.key);

      return prisma.projectImage.delete({ where: { id: input.id } });
    }),

  // ─── Blocks ───────────────────────────────────────────────────────────────

  updateBlock: authProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string(),
        body: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const block = await prisma.contentBlock.findFirst({
        where: { id: input.id, project: { userId: ctx.userId } },
      });
      if (!block) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await prisma.contentBlock.update({
        where: { id: input.id },
        data: { content: input.content, body: input.body },
      });

      const chat = await getOrCreateChat(block.projectId);
      const projectState = await getProjectSnapshot(block.projectId);
      await prisma.chatMessage.create({
        data: {
          chatId: chat.id,
          role: "USER",
          content: `Manually edited "${block.title}"`,
          snapshot: { projectState },
        },
      });

      return updated;
    }),

  deleteBlock: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const block = await prisma.contentBlock.findFirst({
        where: { id: input.id, project: { userId: ctx.userId } },
      });
      if (!block) throw new TRPCError({ code: "NOT_FOUND" });

      await prisma.contentBlock.delete({ where: { id: input.id } });

      const chat = await getOrCreateChat(block.projectId);
      const projectState = await getProjectSnapshot(block.projectId);
      await prisma.chatMessage.create({
        data: {
          chatId: chat.id,
          role: "USER",
          content: `Deleted "${block.title}"`,
          snapshot: { projectState },
        },
      });

      return { id: input.id };
    }),

  // ─── Sections ─────────────────────────────────────────────────────────────

  createSection: authProcedure
    .input(
      z.object({
        projectId: z.string(),
        title: z.string(),
        parentId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
        include: { sections: true },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const maxOrder = Math.max(0, ...project.sections.map((s) => s.order));
      return prisma.section.create({
        data: {
          projectId: input.projectId,
          title: input.title,
          parentId: input.parentId ?? null,
          order: maxOrder + 1,
        },
      });
    }),

  updateSection: authProcedure
    .input(z.object({ id: z.string(), title: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const section = await prisma.section.findFirst({
        where: { id: input.id, project: { userId: ctx.userId } },
      });
      if (!section) throw new TRPCError({ code: "NOT_FOUND" });
      return prisma.section.update({
        where: { id: input.id },
        data: { title: input.title },
      });
    }),

  deleteSection: authProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const section = await prisma.section.findFirst({
        where: { id: input.id, project: { userId: ctx.userId } },
      });
      if (!section) throw new TRPCError({ code: "NOT_FOUND" });

      await prisma.contentBlock.updateMany({
        where: { sectionId: input.id },
        data: { sectionId: null },
      });
      return prisma.section.delete({ where: { id: input.id } });
    }),

  assignBlockToSection: authProcedure
    .input(z.object({ blockId: z.string(), sectionId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      const block = await prisma.contentBlock.findFirst({
        where: { id: input.blockId, project: { userId: ctx.userId } },
      });
      if (!block) throw new TRPCError({ code: "NOT_FOUND" });

      const updated = await prisma.contentBlock.update({
        where: { id: input.blockId },
        data: { sectionId: input.sectionId },
      });

      let message = "";
      if (input.sectionId) {
        const section = await prisma.section.findUnique({
          where: { id: input.sectionId },
        });
        message = `Assigned "${block.title}" to section "${section?.title ?? input.sectionId}"`;
      } else {
        message = `Removed "${block.title}" from its section`;
      }

      const chat = await getOrCreateChat(block.projectId);
      const projectState = await getProjectSnapshot(block.projectId);
      await prisma.chatMessage.create({
        data: {
          chatId: chat.id,
          role: "USER",
          content: message,
          snapshot: { projectState },
        },
      });

      return updated;
    }),

  // ─── Restore ──────────────────────────────────────────────────────────────

  restore: authProcedure
    .input(
      z.object({
        projectId: z.string(),
        snapshot: snapshotSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.userId },
        include: { contentBlocks: true, sections: true },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const snap = input.snapshot;

      await prisma.project.update({
        where: { id: input.projectId },
        data: {
          ...(snap.name !== undefined && { name: snap.name }),
          ...(snap.description !== undefined && {
            description: snap.description,
          }),
          ...(snap.mainColorLight !== undefined && {
            mainColorLight: snap.mainColorLight,
          }),
          ...(snap.mainColorDark !== undefined && {
            mainColorDark: snap.mainColorDark,
          }),
          ...(snap.mainContent !== undefined && {
            mainContent: snap.mainContent,
          }),
          ...(snap.logoUrl !== undefined && { logoUrl: snap.logoUrl }),
          ...(snap.githubUrl !== undefined && { githubUrl: snap.githubUrl }),
        },
      });

      const snapshotBlockIds = new Set(snap.contentBlocks.map((b) => b.id));
      const currentBlockIds = new Set(project.contentBlocks.map((b) => b.id));

      const snapshotSections = snap.sections ?? [];
      const allSnapshotSections = snapshotSections.flatMap((s) => [
        s,
        ...(s.children ?? []),
      ]);
      const snapshotSectionIds = new Set(allSnapshotSections.map((s) => s.id));
      const currentSectionIds = new Set(project.sections.map((s) => s.id));

      await Promise.all([
        ...project.sections
          .filter((s) => !snapshotSectionIds.has(s.id))
          .map((s) => prisma.section.delete({ where: { id: s.id } })),

        ...allSnapshotSections
          .filter((s) => currentSectionIds.has(s.id))
          .map((s) =>
            prisma.section.update({
              where: { id: s.id },
              data: { title: s.title, order: s.order },
            }),
          ),

        ...allSnapshotSections
          .filter((s) => !currentSectionIds.has(s.id))
          .map((s) =>
            prisma.section.create({
              data: {
                id: s.id,
                projectId: input.projectId,
                title: s.title,
                order: s.order,
                parentId: s.parentId ?? null,
              },
            }),
          ),
      ]);

      await Promise.all([
        ...project.contentBlocks
          .filter((b) => !snapshotBlockIds.has(b.id))
          .map((b) => prisma.contentBlock.delete({ where: { id: b.id } })),

        ...snap.contentBlocks
          .filter((b) => currentBlockIds.has(b.id))
          .map((b) =>
            prisma.contentBlock.update({
              where: { id: b.id },
              data: {
                content: b.content,
                title: b.title,
                body: b.body,
                order: b.order,
                sectionId: b.sectionId ?? null,
              },
            }),
          ),

        ...snap.contentBlocks
          .filter((b) => !currentBlockIds.has(b.id))
          .map((b) =>
            prisma.contentBlock.create({
              data: {
                id: b.id,
                projectId: input.projectId,
                kind: b.kind as "DOCUMENT" | "DIAGRAM",
                type: b.type,
                title: b.title,
                content: b.content,
                body: b.body,
                order: b.order,
                sectionId: b.sectionId ?? null,
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

  // ─── Chat ─────────────────────────────────────────────────────────────────

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
});
