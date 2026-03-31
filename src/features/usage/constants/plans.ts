export type Plan = "FREE" | "STARTER" | "PRO";

export const PLAN_LIMITS = {
  FREE: {
    manualCredits: 2,
    githubCredits: 1,
    editTokens: 50_000,
    members: 1,
    projects: 3,
  },
  STARTER: {
    manualCredits: 10,
    githubCredits: 5,
    editTokens: 1_000_000,
    members: 5,
    projects: 10,
  },
  PRO: {
    manualCredits: 60,
    githubCredits: 30,
    editTokens: Infinity,
    members: 20,
    projects: Infinity,
  },
} as const satisfies Record<
  Plan,
  {
    manualCredits: number;
    githubCredits: number;
    editTokens: number;
    members: number;
    projects: number;
  }
>;

export const PLAN_LABELS: Record<Plan, string> = {
  FREE: "Free",
  STARTER: "Starter",
  PRO: "Pro",
};

export const PLAN_PRICES: Record<Plan, string> = {
  FREE: "$0/mo",
  STARTER: "$9.99/mo",
  PRO: "$19.99/mo",
};

export const CLERK_PLAN_SLUGS: Record<string, Plan> = {
  starter: "STARTER",
  pro: "PRO",
};

export function getPlanFromClaims(
  has?: (params: { plan: string }) => boolean,
): Plan {
  if (!has) return "FREE";

  if (has({ plan: "pro" })) return "PRO";
  if (has({ plan: "starter" })) return "STARTER";

  return "FREE";
}
