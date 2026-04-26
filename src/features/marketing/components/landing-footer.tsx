import Image from "next/image";
import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-white/10 mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="StackCraft"
            width={18}
            height={18}
            className="rounded-sm opacity-70"
          />
          <span className="text-[13px] text-white/40 font-medium">StackCraft</span>
        </div>

        <p className="text-[12px] text-white/30">
          © {new Date().getFullYear()} StackCraft. Built with ❤️ for developers.
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-[13px] text-white/40 hover:text-white/70 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/feedback"
            className="text-[13px] text-white/40 hover:text-white/70 transition-colors"
          >
            Feedback
          </Link>
        </div>
      </div>
    </footer>
  );
}
