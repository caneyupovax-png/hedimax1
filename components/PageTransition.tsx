"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [pathname]);

  return (
    <div key={animKey} className="pt-wrap">
      {children}

      <style jsx>{`
        .pt-wrap {
          animation: pageIn 900ms cubic-bezier(0.2, 1, 0.2, 1) both;
          will-change: opacity, transform, filter;
        }

        @keyframes pageIn {
          0% {
            opacity: 0;
            transform: translateY(14px) scale(0.99);
            filter: blur(5px);
          }
          55% {
            opacity: 1;
            transform: translateY(2px) scale(1);
            filter: blur(0.5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .pt-wrap {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
