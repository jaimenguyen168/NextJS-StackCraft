import { createTRPCRouter } from "../init";
import { projectsRouter } from "@/trpc/routers/projects";
import { usersRouter } from "@/trpc/routers/users";
import { usageRouter } from "@/trpc/routers/usageRouter";

export const appRouter = createTRPCRouter({
  projects: projectsRouter,
  users: usersRouter,
  usage: usageRouter,
});

export type AppRouter = typeof appRouter;
