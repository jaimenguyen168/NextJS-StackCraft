import { createTRPCRouter } from "../init";
import { projectsRouter } from "@/trpc/routers/projects";
import { usersRouter } from "@/trpc/routers/users";

export const appRouter = createTRPCRouter({
  projects: projectsRouter,
  users: usersRouter,
});

export type AppRouter = typeof appRouter;
