import { createTRPCRouter } from "../init";
import { projectsRouter } from "@/trpc/routers/projects";

export const appRouter = createTRPCRouter({
  projects: projectsRouter,
});

export type AppRouter = typeof appRouter;
