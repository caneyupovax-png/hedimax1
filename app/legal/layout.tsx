import type { ReactNode } from "react";
import Image from "next/image";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* BACKGROUND — GPU kilitli */}
      <div className="fixed inset-0 -z-10 transform-gpu [will-change:transform]">
        <Image
          src="/bg/earn-bg.jpg"
          alt="Background"
          fill
          priority
          className="object-cover"
        />

        {/* ana karartma */}
        <div className="absolute inset-0 bg-black/45" />

        {/* glow */}
        <div className="absolute inset-0 [background:radial-gradient(900px_420px_at_50%_-80px,rgba(255,255,255,0.14),transparent_60%)]" />
      </div>

      {/* CONTENT */}
      <main
        className="
          relative z-10
          caret-transparent
          selection:bg-emerald-500/25 selection:text-white
        "
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
          <div
            className="
              rounded-3xl
              border border-white/15
              bg-white/[0.12]
              backdrop-blur-xl
              shadow-[0_25px_80px_rgba(0,0,0,0.35)]
            "
          >
            <div className="p-6 sm:p-8">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
