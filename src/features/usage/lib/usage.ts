import { prisma } from "@/lib/db";
import { PLAN_LIMITS, type Plan } from "@/features/usage/constants/plans";

// ─── Get or create subscription record ───────────────────────────────────────

export async function getOrCreateSubscription(userId: string) {
  return prisma.userSubscription.upsert({
    where: { userId },
    create: { userId, periodStart: new Date() },
    update: {},
  });
}

// ─── Reset period if new month ────────────────────────────────────────────────

export async function getSubscriptionWithReset(userId: string) {
  const sub = await getOrCreateSubscription(userId);
  const now = new Date();
  const period = new Date(sub.periodStart);

  // Check if a full month has passed since periodStart
  const nextReset = new Date(period);
  nextReset.setMonth(nextReset.getMonth() + 1);

  if (now >= nextReset) {
    return prisma.userSubscription.update({
      where: { userId },
      data: {
        manualCreditsUsed: 0,
        githubCreditsUsed: 0,
        editTokensUsed: 0,
        periodStart: nextReset,
      },
    });
  }

  return sub;
}

// ─── Check helpers ────────────────────────────────────────────────────────────

export async function checkManualCredit(userId: string, plan: Plan) {
  const sub = await getSubscriptionWithReset(userId);
  const limit = PLAN_LIMITS[plan].manualCredits;
  const used = sub.manualCreditsUsed;
  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export async function checkGithubCredit(userId: string, plan: Plan) {
  const sub = await getSubscriptionWithReset(userId);
  const limit = PLAN_LIMITS[plan].githubCredits;
  const used = sub.githubCreditsUsed;
  return {
    allowed: used < limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export async function checkEditTokens(
  userId: string,
  plan: Plan,
  estimatedTokens = 7000,
) {
  const sub = await getSubscriptionWithReset(userId);
  const limit = PLAN_LIMITS[plan].editTokens;
  if (limit === Infinity)
    return {
      allowed: true,
      used: sub.editTokensUsed,
      limit,
      remaining: Infinity,
    };
  const used = sub.editTokensUsed;
  return {
    allowed: used + estimatedTokens <= limit,
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

// ─── Consume helpers ──────────────────────────────────────────────────────────

export async function consumeManualCredit(userId: string) {
  return prisma.userSubscription.update({
    where: { userId },
    data: { manualCreditsUsed: { increment: 1 } },
  });
}

export async function consumeGithubCredit(userId: string) {
  return prisma.userSubscription.update({
    where: { userId },
    data: { githubCreditsUsed: { increment: 1 } },
  });
}

export async function consumeEditTokens(
  userId: string,
  plan: Plan,
  tokens: number,
) {
  if (PLAN_LIMITS[plan].editTokens === Infinity) return;
  return prisma.userSubscription.update({
    where: { userId },
    data: { editTokensUsed: { increment: tokens } },
  });
}

// ─── Full usage snapshot (for UI) ────────────────────────────────────────────

export async function getUsageSnapshot(userId: string, plan: Plan) {
  const sub = await getSubscriptionWithReset(userId);
  const limits = PLAN_LIMITS[plan];

  return {
    plan,
    manualCredits: {
      used: sub.manualCreditsUsed,
      limit: limits.manualCredits,
      remaining: Math.max(0, limits.manualCredits - sub.manualCreditsUsed),
      percent:
        limits.manualCredits === Infinity
          ? 0
          : Math.round((sub.manualCreditsUsed / limits.manualCredits) * 100),
    },
    githubCredits: {
      used: sub.githubCreditsUsed,
      limit: limits.githubCredits,
      remaining: Math.max(0, limits.githubCredits - sub.githubCreditsUsed),
      percent:
        limits.githubCredits === Infinity
          ? 0
          : Math.round((sub.githubCreditsUsed / limits.githubCredits) * 100),
    },
    editTokens: {
      used: sub.editTokensUsed,
      limit: limits.editTokens,
      remaining:
        limits.editTokens === Infinity
          ? Infinity
          : Math.max(0, limits.editTokens - sub.editTokensUsed),
      percent:
        limits.editTokens === Infinity
          ? 0
          : Math.round((sub.editTokensUsed / limits.editTokens) * 100),
    },
    periodStart: sub.periodStart,
  };
}
