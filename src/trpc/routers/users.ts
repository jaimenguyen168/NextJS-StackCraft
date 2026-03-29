import { z } from "zod";
import { createTRPCRouter, authProcedure } from "@/trpc/init";
import { prisma } from "@/lib/db";

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
        select: {
          id: true,
          username: true,
          name: true,
          imageUrl: true,
          email: true,
        },
      });
    }),

  getMe: authProcedure.query(async ({ ctx }) => {
    return prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        imageUrl: true,
        githubUrl: true,
        createdAt: true,
      },
    });
  }),
});
