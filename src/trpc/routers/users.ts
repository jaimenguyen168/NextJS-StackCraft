import { z } from "zod";
import { createTRPCRouter, authProcedure } from "@/trpc/init";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/encryption";

export const usersRouter = createTRPCRouter({
  search: authProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!input.query.trim()) return [];
      return prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: input.query, mode: "insensitive" } },
            { name: { contains: input.query, mode: "insensitive" } },
            { email: { contains: input.query, mode: "insensitive" } },
          ],
          NOT: { id: ctx.userId },
        },
        take: 8,
        select: { id: true, username: true, name: true, imageUrl: true, email: true },
      });
    }),

  getMe: authProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        imageUrl: true,
        githubUrl: true,
        openaiApiKey: true,
        createdAt: true,
      },
    });
    if (!user) return null;
    // Never return actual key — only whether it's set
    return {
      ...user,
      openaiApiKey: undefined,
      hasOpenaiKey: !!user.openaiApiKey,
    };
  }),

  setOpenaiKey: authProcedure
    .input(z.object({ key: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await prisma.user.update({
        where: { id: ctx.userId },
        data: { openaiApiKey: encrypt(input.key.trim()) },
      });
      return { ok: true };
    }),

  removeOpenaiKey: authProcedure.mutation(async ({ ctx }) => {
    await prisma.user.update({
      where: { id: ctx.userId },
      data: { openaiApiKey: null },
    });
    return { ok: true };
  }),
});
