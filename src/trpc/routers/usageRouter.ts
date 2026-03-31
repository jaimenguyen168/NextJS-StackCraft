import { createTRPCRouter, authProcedure } from "@/trpc/init";
import { getUsageSnapshot } from "@/features/usage/lib/usage";
import { getPlanFromClaims } from "@/features/usage/constants/plans";

export const usageRouter = createTRPCRouter({
  getUsage: authProcedure.query(async ({ ctx }) => {
    try {
      const plan = getPlanFromClaims(ctx.has);
      return await getUsageSnapshot(ctx.userId, plan);
    } catch (err) {
      console.error("🔥 getUsage crash:", err);
      throw err;
    }
  }),
});
