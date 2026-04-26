"use client";

import { Suspense } from "react";
import { LandingHeader } from "@/features/marketing/components/landing-header";
import { LandingHero } from "@/features/marketing/components/landing-hero";
import { LandingAbout } from "@/features/marketing/components/landing-about";
import { LandingFeatures } from "@/features/marketing/components/landing-features";
import { LandingProjects } from "@/features/marketing/components/landing-projects";
import { LandingCta } from "@/features/marketing/components/landing-cta";
import { LandingFooter } from "@/features/marketing/components/landing-footer";

export function LandingView() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-white relative overflow-x-hidden">
      {/* Gradient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#35a85a]/20 blur-[120px]" />
        <div className="absolute -top-20 right-0 w-[500px] h-[500px] rounded-full bg-[#2563eb]/15 blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#35a85a]/10 blur-[140px]" />
      </div>

      <LandingHeader />
      <LandingHero />
      <LandingAbout />
      <LandingFeatures />

      <Suspense fallback={null}>
        <LandingProjects />
      </Suspense>

      <LandingCta />
      <LandingFooter />
    </div>
  );
}
