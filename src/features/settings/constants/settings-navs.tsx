import React from "react";
import { GeneralSection } from "@/features/settings/components/general-section";
import { PrivacySection } from "@/features/settings/components/privacy-section";
import { BillingSection } from "@/features/settings/components/billing-section";
import { UsageSection } from "@/features/settings/components/usage-section";

export const NAV_ITEMS = [
  { id: "general", label: "General" },
  { id: "privacy", label: "Privacy" },
  { id: "billing", label: "Billing" },
  { id: "usage", label: "Usage" },
] as const;

export type NavId = (typeof NAV_ITEMS)[number]["id"];

export const SECTIONS: Record<NavId, React.ReactNode> = {
  general: <GeneralSection />,
  privacy: <PrivacySection />,
  billing: <BillingSection />,
  usage: <UsageSection />,
};
