"use client";

import React from "react";
import PageHeader from "@/components/page-header";
import { PricingTable } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { COLORS } from "@/lib/colors";
import { useSubscriptions } from "@/trpc/hooks/use-subscriptions";
import { Button } from "@/components/ui/button";
import { SparklesIcon } from "lucide-react";
import { useClerk } from "@clerk/nextjs";

export default function PricingView() {
  const { resolvedTheme } = useTheme();
  const { isFree, planLabel } = useSubscriptions();
  const { openUserProfile } = useClerk();

  const c = resolvedTheme === "dark" ? COLORS.dark : COLORS.light;

  return (
    <div className="relative">
      <PageHeader title="Pricing" />
      <div className="relative space-y-8 p-4 lg:p-16 container mx-auto">
        <div className="flex flex-col items-center text-center mb-12 pt-4">
          <h1 className="text-[2.5rem] font-medium leading-tight tracking-tight mb-4">
            The right plan for
            <br />
            every project
          </h1>

          <p className="text-muted-foreground max-w-lg leading-relaxed">
            Start free. Upgrade when you need more generates, GitHub imports,
            and team collaboration.
          </p>
        </div>

        {isFree ? (
          <PricingTable
            newSubscriptionRedirectUrl="/"
            appearance={{
              variables: {
                colorPrimary: c.colorPrimary,
                colorText: c.colorText,
                colorBackground: c.colorBackground,
                colorInputBackground: c.colorInputBackground,
                borderRadius: "0.5rem",
                fontFamily: "inherit",
              },
              elements: {
                pricingTableCardButton: {
                  backgroundColor: c.buttonBg,
                  color: c.buttonText,
                  borderRadius: "calc(0.5rem - 2px)",
                  fontWeight: "500",
                  fontSize: "0.875rem",
                  border: "none",
                  padding: "0.5rem 1rem",
                  lineHeight: "1.25rem",
                  boxShadow: "none",
                  transition: "opacity 0.15s ease",
                },
                pricingTableCardButtonCurrentPlan: {
                  backgroundColor: "transparent",
                  color: c.currentPlanText,
                  border: `1px solid ${c.currentPlanBorder}`,
                  borderRadius: "calc(0.5rem - 2px)",
                  fontWeight: "500",
                  fontSize: "0.875rem",
                },
              },
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
              <SparklesIcon className="size-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">
              You&apos;re on the {planLabel} plan
            </h2>
            <p className="text-muted-foreground max-w-sm text-sm leading-relaxed">
              You already have an active subscription. Manage your plan, update
              your payment method, or cancel from your account settings.
            </p>
            <Button onClick={() => openUserProfile()}>
              Manage subscription
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
