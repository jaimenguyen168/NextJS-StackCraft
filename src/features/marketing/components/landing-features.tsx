import { FEATURES } from "@/features/marketing/constants/features";

export function LandingFeatures() {
  return (
    <section className="relative z-10 w-full max-w-5xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-white mb-3">Everything you need</h2>
        <p className="text-white/50 text-[15px] max-w-md mx-auto">
          From first idea to production-ready architecture docs, StackCraft has you covered.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="flex flex-col gap-3 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
          >
            <div className="size-9 rounded-xl bg-[#35a85a]/15 flex items-center justify-center shrink-0">
              <feature.icon className="size-[18px] text-[#35a85a]" />
            </div>
            <h3 className="font-semibold text-[15px] text-white">{feature.title}</h3>
            <p className="text-[13px] text-white/50 leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
