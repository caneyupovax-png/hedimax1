// components/RouteProgress.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function RouteProgress() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // route değişince kısa bir süre bar göster
    setShow(true);
    const t = setTimeout(() => setShow(false), 700);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!show) return null;

  return (
    <div className="fixed left-0 top-0 z-[99999] h-[3px] w-full">
      <div className="h-full w-full overflow-hidden bg-white/10">
        <div className="h-full w-1/3 animate-[bar_700ms_ease-out_forwards] bg-white/60" />
      </div>

      <style jsx>{`
        @keyframes bar {
          0% { transform: translateX(-100%); width: 20%; opacity: .6; }
          60% { transform: translateX(80%); width: 50%; opacity: .9; }
          100% { transform: translateX(180%); width: 70%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
