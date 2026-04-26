"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function LandingHero() {
  const { isSignedIn } = useAuth();

  return (
    <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-20 max-w-4xl mx-auto w-full">
      <Badge
        variant="outline"
        className="mb-6 border-[#35a85a]/40 text-[#35a85a] bg-[#35a85a]/10 text-[12px] font-medium px-3 py-1 rounded-full"
      >
        Architecture docs, powered by AI
      </Badge>

      <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
        Turn ideas into
        <br />
        <span className="text-[#35a85a]">technical blueprints</span>
      </h1>

      <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed mb-10">
        StackCraft takes your project idea and generates a full architecture doc — schema design,
        tech stack, API structure, and a development timeline — in seconds.
      </p>

      <div className="flex items-center gap-3 flex-wrap justify-center">
        {isSignedIn ? (
          <Button
            asChild
            size="lg"
            className="bg-[#35a85a] hover:bg-[#2d9450] text-white rounded-xl font-semibold px-7 h-12 text-[15px]"
          >
            <Link href="/dashboard">
              Open Dashboard <ArrowRightIcon className="size-4 ml-1" />
            </Link>
          </Button>
        ) : (
          <>
            <Button
              asChild
              size="lg"
              className="bg-[#35a85a] hover:bg-[#2d9450] text-white rounded-xl font-semibold px-7 h-12 text-[15px]"
            >
              <Link href="/sign-up">
                Start for free <ArrowRightIcon className="size-4 ml-1" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/15 text-white/70 hover:bg-white/10 hover:text-white rounded-xl font-medium px-7 h-12 text-[15px] bg-transparent"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
