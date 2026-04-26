"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  const { isSignedIn } = useAuth();

  return (
    <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-2.5">
        <Image
          src="/logo.svg"
          alt="StackCraft"
          width={26}
          height={26}
          className="rounded-md"
        />
        <span className="font-semibold text-[16px] tracking-tight">StackCraft</span>
      </div>

      <div className="flex items-center gap-3">
        {isSignedIn ? (
          <Button
            asChild
            size="sm"
            className="bg-[#35a85a] hover:bg-[#2d9450] text-white rounded-lg text-[13px] font-medium px-4"
          >
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        ) : (
          <>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-[13px] font-medium"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-[#35a85a] hover:bg-[#2d9450] text-white rounded-lg text-[13px] font-medium px-4"
            >
              <Link href="/sign-up">Get started free</Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
