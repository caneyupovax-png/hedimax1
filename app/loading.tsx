// app/loading.tsx
"use client";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4">
        {/* Coin */}
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.35)] animate-spin [animation-duration:900ms]" />
          <div className="absolute inset-[6px] rounded-full bg-black/35" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-black/80 font-extrabold text-xl select-none">$</span>
          </div>
        </div>

        <div className="text-white/85 text-sm">
          Loading…
        </div>

        {/* shimmer bar */}
        <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-[shimmer_1s_infinite] rounded-full bg-white/35" />
        </div>

        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    </div>
  );
}
