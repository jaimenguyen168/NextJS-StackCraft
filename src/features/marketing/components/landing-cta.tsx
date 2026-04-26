"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingCta() {
  const { isSignedIn } = useAuth();

  return (
    <section className="relative z-10 w-full max-w-5xl mx-auto px-6 py-16">
      <div className="rounded-3xl border border-[#35a85a]/30 bg-[#35a85a]/10 backdrop-blur-sm p-10 sm:p-14 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to craft your stack?</h2>
        <p className="text-white/50 text-[15px] mb-8 max-w-md mx-auto">
          Join developers who use StackCraft to plan, document, and ship better software.
        </p>
        <Button
          asChild
          size="lg"
          className="bg-[#35a85a] hover:bg-[#2d9450] text-white rounded-xl font-semibold px-8 h-12 text-[15px]"
        >
          {isSignedIn ? (
            <Link href="/dashboard">Go to Dashboard</Link>
          ) : (
            <Link href="/sign-up">
              Get started free <ArrowRightIcon className="size-4 ml-1" />
            </Link>
          )}
        </Button>
      </div>
    </section>
  );
}
