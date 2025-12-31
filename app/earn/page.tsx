"use client";

import Image from "next/image";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Partner = {
  name: string;
  slug: string;
  kind: "offerwall" | "survey";
  comingSoon?: boolean;
  badge?: string;
  logo?: string;
  solid?: string;
};

/* ----------------------------- helpers ----------------------------- */
function getMarkText(name: string) {
  const safe = (name || "").trim();
  if (!safe) return "X";
  const words = safe.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return safe.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "X";
}

function svgWordmarkDataUri(label: string, accent = "#22c55e") {
  const mark = getMarkText(label);
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="360" height="128" viewBox="0 0 360 128">
    <rect width="360" height="128" rx="26" fill="rgba(255,255,255,0.08)"/>
    <rect x="1" y="1" width="358" height="126" rx="25"
      fill="rgba(0,0,0,0.22)" stroke="rgba(255,255,255,0.12)"/>
    <rect x="14" y="14" width="332" height="6" rx="3" fill="${accent}" opacity="0.85"/>
    <rect x="26" y="40" width="48" height="48" rx="16" fill="${accent}"/>
    <text x="50" y="71" text-anchor="middle" font-family="Inter,system-ui,Arial" font-size="18" font-weight="900" fill="white">${mark}</text>
    <text x="90" y="72" font-family="Inter,system-ui,Arial" font-size="24" font-weight="900" fill="white">${label}</text>
  </svg>`.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/* ------------------------------ page ------------------------------- */
export default function EarnPage() {
  const router = useRouter();
  const supabase = createClient();

  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  };

  const PARTNERS: Partner[] = useMemo(
    () => [
      { name: "Lootably", slug: "lootably", kind: "offerwall", comingSoon: true, solid: "#0ea5e9" },
      { name: "MM Wall", slug: "mmwall", kind: "offerwall", comingSoon: true, solid: "#ef4444" },
      { name: "AdGate", slug: "adgate", kind: "offerwall", comingSoon: true, solid: "#2dd4bf" },
      { name: "Torox", slug: "torox", kind: "offerwall", comingSoon: true, solid: "#f97316" },
      { name: "Notik", slug: "notik", kind: "offerwall", comingSoon: true, solid: "#64748b" },

      {
        name: "CPX Research",
        slug: "cpx",
        kind: "survey",
        badge: "Recommended",
        logo: "/partners/cpx.png",
        solid: "#22c55e",
      },
    ],
    []
  );

  const offerwalls = PARTNERS.filter((p) => p.kind === "offerwall");
  const surveys = PARTNERS.filter((p) => p.kind === "survey");

  const openPartner = async (p: Partner) => {
    if (p.comingSoon) {
      showToast(`${p.name} — Coming soon`);
      return;
    }

    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push(`/login?next=/earn`);
      return;
    }

    if (p.slug === "cpx") {
      const res = await fetch(`/api/offerwall/cpx?user_id=${data.user.id}`);
      const json = await res.json().catch(() => ({} as any));
      if (json?.url) window.open(json.url, "_blank", "noopener,noreferrer");
      return;
    }

    router.push(`/offerwall/${p.slug}`);
  };

  return (
    <div className="relative min-h-screen">
      {/* FULLSCREEN BACKGROUND */}
      <div className="fixed inset-0 -z-10">
        <Image src="/bg/earn-bg.jpg" alt="Earn bg" fill priority className="object-cover" />
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 [background:radial-gradient(900px_420px_at_50%_-80px,rgba(255,255,255,0.12),transparent_60%)]" />
      </div>

      {/* TOAST (navbar altına + üstte kalsın) */}
      {toast ? (
        <div className="fixed top-24 right-6 z-[9999]">
          <div className="rounded-2xl border border-white/15 bg-black/55 backdrop-blur px-4 py-3 text-white shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
            <div className="text-sm font-semibold">{toast}</div>
            <div className="text-xs text-white/60">This provider will be available soon.</div>
          </div>
        </div>
      ) : null}

      {/* CONTENT */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8">
        <h2 className="mt-10 text-2xl font-extrabold text-white">Providers</h2>
        <OfferwallCarousel items={offerwalls} onOpen={openPartner} />

        <h2 className="mt-14 text-2xl font-extrabold text-white">Survey Partners</h2>

        {/* ✅ Survey kartlarını da aynı 300px ritminde hizala */}
        <div className="mt-5 flex flex-wrap gap-8">
          {surveys.map((p) => (
            <SurveyCard key={p.slug} p={p} onOpen={openPartner} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* OFFERWALL CAROUSEL (NO HALF CARDS, MULTIPLE VISIBLE) */
/* ------------------------------------------------------------------ */
function OfferwallCarousel({ items, onOpen }: { items: Partner[]; onOpen: (p: Partner) => void }) {
  const ref = useRef<HTMLDivElement>(null);

  const CARD_W = 300;
  const GAP = 32; // gap-8
  const STEP = CARD_W + GAP; // 332

  return (
    <div className="relative mt-6">
      <div className="absolute -top-12 right-0 flex gap-2">
        <button
          type="button"
          onClick={() => ref.current?.scrollBy({ left: -STEP, behavior: "smooth" })}
          className="h-10 w-10 rounded-xl bg-white/[0.10] hover:bg-white/[0.18] text-white transition cursor-pointer"
          aria-label="Prev"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => ref.current?.scrollBy({ left: STEP, behavior: "smooth" })}
          className="h-10 w-10 rounded-xl bg-white/[0.10] hover:bg-white/[0.18] text-white transition cursor-pointer"
          aria-label="Next"
        >
          ›
        </button>
      </div>

      <div
        className="
          mx-auto overflow-hidden
          w-[300px]
          md:w-[calc(300px*2+32px)]
          lg:w-[calc(300px*3+64px)]
          max-w-full
        "
      >
        <div
          ref={ref}
          className="flex gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory
          [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {items.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => onOpen(p)}
              className="flex-shrink-0 cursor-pointer group text-left snap-start [scroll-snap-stop:always]"
              style={{ width: CARD_W }}
              title={p.comingSoon ? "Coming soon" : "Open"}
            >
              <Image
                src={svgWordmarkDataUri(p.name, p.solid)}
                alt={p.name}
                width={CARD_W}
                height={110}
                unoptimized
                className="transition-transform group-hover:scale-[1.03]"
              />
              <div className="mt-2 text-center text-xs text-white/60">
                {p.comingSoon ? "Coming soon" : "Open"}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SURVEY CARD – CPX: same width as offerwalls, tidy alignment */
/* ------------------------------------------------------------------ */
function SurveyCard({ p, onOpen }: { p: Partner; onOpen: (p: Partner) => void }) {
  const isCpx = p.slug === "cpx";
  const [ok, setOk] = useState(true);

  const fallback = svgWordmarkDataUri(p.name, p.solid || "#22c55e");
  const src = ok && p.logo ? p.logo : fallback;

  return (
    <button
      type="button"
      onClick={() => onOpen(p)}
      title="Open"
      className="
        w-[300px] max-w-full text-left
        rounded-3xl bg-white/[0.05] backdrop-blur
        border border-white/10 hover:border-white/20 hover:bg-white/[0.07]
        transition cursor-pointer shadow-[0_18px_60px_rgba(0,0,0,0.25)]
        p-4
      "
    >
      {isCpx ? (
        <div>
          {/* ✅ daha kompakt logo alanı */}
          <div className="relative w-full h-[44px]">
            <Image
              src={src}
              alt="CPX Research"
              fill
              className="object-contain invert brightness-200 contrast-200"
              onError={() => setOk(false)}
              unoptimized={src.startsWith("data:image")}
            />
          </div>

          {/* ✅ Recommended + Open aynı hizada, boşluk az */}
          <div className="mt-3 flex items-center justify-between gap-3">
            {p.badge ? (
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">
                {p.badge}
              </span>
            ) : (
              <span />
            )}

            <span className="btn-primary">Open</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <span className="btn-primary">Open</span>
        </div>
      )}
    </button>
  );
}
