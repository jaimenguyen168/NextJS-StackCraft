export function LandingAbout() {
  return (
    <section className="relative z-10 w-full max-w-5xl mx-auto px-6 py-16">
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-10 sm:p-14 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">
          Stop writing docs from scratch
        </h2>
        <p className="text-white/50 text-[15px] leading-relaxed max-w-2xl mx-auto">
          Most developers skip architecture documentation because it{"'"}s time-consuming.
          StackCraft flips that — describe your project in a few sentences and get a structured,
          shareable doc that covers your stack, data models, authentication, API design, and more.
          Connect your GitHub repo to keep it living alongside your code.
        </p>
      </div>
    </section>
  );
}
