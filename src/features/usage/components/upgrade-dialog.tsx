"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckIcon, SparklesIcon } from "lucide-react";
import { PLAN_LIMITS } from "@/features/usage/constants/plans";
import { useAuth } from "@clerk/nextjs";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLANS = [
  {
    key: "STARTER" as const,
    name: "Starter",
    price: "$9",
    clerkPlanSlug: "starter",
    highlight: false,
    perks: [
      `${PLAN_LIMITS.STARTER.manualCredits} manual generates/mo`,
      `${PLAN_LIMITS.STARTER.githubCredits} GitHub imports/mo`,
      `${(PLAN_LIMITS.STARTER.editTokens / 1000).toFixed(0)}K edit tokens/mo`,
      `${PLAN_LIMITS.STARTER.members} team members`,
      `${PLAN_LIMITS.STARTER.projects} projects`,
    ],
  },
  {
    key: "PRO" as const,
    name: "Pro",
    price: "$29",
    clerkPlanSlug: "pro",
    highlight: true,
    perks: [
      `${PLAN_LIMITS.PRO.manualCredits} manual generates/mo`,
      `${PLAN_LIMITS.PRO.githubCredits} GitHub imports/mo`,
      "Unlimited edit tokens",
      `${PLAN_LIMITS.PRO.members} team members`,
      "Unlimited projects",
    ],
  },
];

export function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
  const { isSignedIn } = useAuth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="size-4" />
            Upgrade StackCraft
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-lg border p-4 space-y-4 ${
                plan.highlight ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              {plan.highlight && (
                <span className="text-[10px] font-medium text-primary uppercase tracking-widest">
                  Most popular
                </span>
              )}
              <div>
                <p className="text-sm font-semibold">{plan.name}</p>
                <p className="text-xl font-bold mt-0.5">
                  {plan.price}
                  <span className="text-xs font-normal text-muted-foreground">
                    /mo
                  </span>
                </p>
              </div>

              <ul className="space-y-1.5">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-1.5">
                    <CheckIcon className="size-3 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-[12px] text-muted-foreground">
                      {perk}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Clerk Billing checkout — use their PricingTable or direct link */}
              {isSignedIn ? (
                <Button
                  size="sm"
                  className="w-full"
                  variant={plan.highlight ? "default" : "outline"}
                  onClick={() => {
                    window.location.href = `/usage/checkout?plan=${plan.clerkPlanSlug}`;
                  }}
                >
                  Get {plan.name}
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    window.location.href = "/sign-in";
                  }}
                >
                  Sign in to upgrade
                </Button>
              )}
            </div>
          ))}
        </div>

        <p className="text-[11px] text-center text-muted-foreground">
          Billed monthly. Cancel anytime. Resets on billing date.
        </p>
      </DialogContent>
    </Dialog>
  );
}
