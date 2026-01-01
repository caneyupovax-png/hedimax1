"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const MIN_SHOW_MS = 350;

export default function RouteTransition() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  // Link tıklanınca (aynı origin) anında göster
  useEffect(() => {
    const onClickCapture = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return; // sadece sol tık
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      let el = e.target as HTMLElement | null;
      while (el && el.tagName !== "A") el = el.parentElement;
      if (!el) return;

      const a = el as HTMLAnchorElement;
      const href = a.getAttribute("href");
      if (!href) return;
      if (href.startsWith("#")) return;

      // yeni sekme vs.
      const target = a.getAttribute("target");
      if (target && target !== "_self") return;

      // dış linkleri es geç
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
      } catch {
        return;
      }

      shownAtRef.current = Date.now();
      setShow(true);
    };

    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, []);

  // Route değişince minimum süre dolunca kapat
  useEffect(() => {
    if (!show) return;

    const shownAt = shownAtRef.current ?? Date.now();
    const elapsed = Date.now() - shownAt;
    const remaining = Math.max(0, MIN_SHOW_MS - elapsed);

    const t = window.setTimeout(() => {
      setShow(false);
      shownAtRef.current = null;
    }, remaining);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.35)] animate-spin [animation-duration:900ms]" />
          <div className="absolute inset-[6px] rounded-full bg-black/35" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-black/80 font-extrabold text-xl select-none">$</span>
          </div>
        </div>

        <div className="text-white/85 text-sm">Loading…</div>

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
