"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Partner = {
  name: string;
  slug: string;
  kind: "offerwall" | "survey";
  comingSoon?: boolean;

  // UI
  subtitle?: string;
  badge?: string; // e.g. "Recommended"
  bonus?: string; // e.g. "+50%"
  rating?: number; // 0..5
  logo?: string; // e.g. "/partners/adgate.png"
  bg?: { a: string; b: string; c?: string }; // gradient colors
};

function svgLogoDataUri(label: string) {
  const safe = (label || "X").trim();
  const initials =
    safe
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 2) || "X";

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="rgba(34,211,238,0.35)"/>
        <stop offset="0.55" stop-color="rgba(34,197,94,0.35)"/>
        <stop offset="1" stop-color="rgba(99,102,241,0.30)"/>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="128" height="128" rx="28" fill="rgba(255,255,255,0.06)"/>
    <rect x="6" y="6" width="116" height="116" rx="24" fill="url(#g)" opacity="0.55"/>
    <rect x="10" y="10" width="108" height="108" rx="22" fill="rgba(0,0,0,0.18)"/>
    <text x="64" y="74" text-anchor="middle"
      font-family="Inter, Arial, sans-serif"
      font-size="44" font-weight="800"
      fill="white" fill-opacity="0.92">${initials}</text>
  </svg>`.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function EarnPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  const PARTNERS: Partner[] = useMemo(
    () => [
      // OFFERWALLS (display like screenshot, currently coming soon)
      {
        name: "AdGate",
        slug: "adgate",
        kind: "offerwall",
        comingSoon: true,
        bonus: "+50%",
        rating: 4,
        logo: "/partners/adgate.png",
        bg: { a: "#0b3a52", b: "#1f2d3a", c: "#0a1a2a" },
      },
      {
        name: "Ayet Studios",
        slug: "ayet",
        kind: "offerwall",
        comingSoon: true,
        bonus: "+50%",
        rating: 4,
        logo: "/partners/ayet.png",
        bg: { a: "#3c2d22", b: "#2a1f18", c: "#14121a" },
      },
      {
        name: "Torox",
        slug: "torox",
        kind: "offerwall",
        comingSoon: true,
        bonus: "+50%",
        rating: 4,
        logo: "/partners/torox.png",
        bg: { a: "#3c2f78", b: "#211b40", c: "#121226" },
      },
      {
        name: "MM Wall",
        slug: "mmwall",
        kind: "offerwall",
        comingSoon: true,
        bonus: "+50%",
        rating: 4,
        logo: "/partners/mmwall.png",
        bg: { a: "#5a5a18", b: "#2a2a12", c: "#101018" },
      },
      {
        name: "Revenue Universe",
        slug: "revu",
        kind: "offerwall",
        comingSoon: true,
        bonus: "+50%",
        rating: 3,
        logo: "/partners/revu.png",
        bg: { a: "#22314a", b: "#151b2a", c: "#0f1220" },
      },
      {
        name: "Monlix",
        slug: "monlix",
        kind: "offerwall",
        comingSoon: true,
        bonus: "+50%",
        rating: 4,
        logo: "/partners/monlix.png",
        bg: { a: "#1d3b3b", b: "#132727", c: "#0e141e" },
      },

      // SURVEYS
      {
        name: "CPX Research",
        slug: "cpx",
        kind: "survey",
        comingSoon: false,
        subtitle: "Surveys (opens in a new tab)",
        badge: "Recommended",
        rating: 4,
        logo: "/partners/cpx.png",
      },
      {
        name: "BitLabs",
        slug: "bitlabs",
        kind: "survey",
        comingSoon: true,
        subtitle: "Surveys",
        rating: 4,
        logo: "/partners/bitlabs.png",
      },
      {
        name: "YourSurveys",
        slug: "yoursurveys",
        kind: "survey",
        comingSoon: true,
        subtitle: "Surveys",
        rating: 4,
        logo: "/partners/yoursurveys.png",
      },
      {
        name: "Prime Surveys",
        slug: "primesurveys",
        kind: "survey",
        comingSoon: true,
        subtitle: "Surveys",
        rating: 4,
        logo: "/partners/primesurveys.png",
      },
    ],
    []
  );

  const offerwalls = PARTNERS.filter((p) => p.kind === "offerwall");
  const surveys = PARTNERS.filter((p) => p.kind === "survey");

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setIsAuthed(!!data.user);
      setLoading(false);
    };

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPartner = async (p: Partner) => {
    if (p.comingSoon) return;

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      router.push(`/login?next=/earn`);
      return;
    }

    if (p.slug === "cpx") {
      const res = await fetch(
        `/api/offerwall/cpx?user_id=${encodeURIComponent(user.id)}`,
        { cache: "no-store" }
      );
      const json = await res.json().catch(() => ({} as any));

      if (!res.ok || !json?.ok || !json?.url) {
        alert(json?.error || `Failed to open CPX (HTTP ${res.status})`);
        return;
      }

      window.open(json.url, "_blank", "noopener,noreferrer");
      return;
    }

    router.push(`/offerwall/${p.slug}`);
  };

  return (
    <div>
      {/* no guest flash */}
      {!loading && !isAuthed && (
        <div className="card-glass p-6">
          <div className="text-2xl font-extrabold text-white">
            Continue as Guest
          </div>
          <div className="mt-2 text-sm text-white/65 max-w-2xl">
            Login to track coins and open survey partners.
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/?auth=login" className="btn-primary inline-flex">
              Login
            </Link>
            <Link href="/?auth=register" className="btn-ghost inline-flex">
              Create account
            </Link>
          </div>
        </div>
      )}

      {/* OFFERWALLS (carousel like screenshot) */}
      <HeaderRow title="Offerwall Partners" />

      <div className="mt-4">
        <div className="flex gap-4 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {offerwalls.map((p) => (
            <OfferwallCard key={p.slug} p={p} onOpen={openPartner} />
          ))}
        </div>

        <div className="mt-3 text-sm text-white/60">
          Offerwalls are currently disabled. They will be available soon.
        </div>
      </div>

      {/* SURVEYS */}
      <div className="mt-12">
        <HeaderRow title="Survey Partners" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {surveys.map((p) => (
            <SurveyCard key={p.slug} p={p} onOpen={openPartner} />
          ))}
        </div>
      </div>

      <div className="mt-12 card-glass p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-white font-semibold">Hedimax rate</div>
          <div className="text-white/75 text-sm">
            1 USD = <span className="text-white font-semibold">1000 coin</span>
          </div>
        </div>
        <div className="mt-2 text-white/60 text-sm">
          Coins are credited automatically after completion via postback.
        </div>
      </div>
    </div>
  );
}

function HeaderRow({ title }: { title: string }) {
  return (
    <div className="mt-10 flex items-center gap-2">
      <span className="text-emerald-200">◆</span>
      <h2 className="text-2xl font-extrabold text-white">{title}</h2>
      <span className="text-white/40 text-sm">ⓘ</span>
    </div>
  );
}

function Stars({ rating = 0 }: { rating?: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={i < r ? "text-amber-300" : "text-white/20"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function OfferwallCard({
  p,
  onOpen,
}: {
  p: Partner;
  onOpen: (p: Partner) => void;
}) {
  const disabled = !!p.comingSoon;
  const logoSrc = p.logo || svgLogoDataUri(p.name);

  const bg = p.bg || { a: "#1b2a3a", b: "#141b2a", c: "#0b0d18" };
  const bgStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${bg.a} 0%, ${bg.b} 55%, ${bg.c ?? bg.b} 100%)`,
  };

  return (
    <button
      type="button"
      onClick={() => onOpen(p)}
      className="relative w-[240px] min-w-[240px] h-[170px] rounded-2xl border border-white/10 overflow-hidden text-left hover:border-emerald-400/25 transition"
      style={bgStyle}
      disabled={disabled}
      title={disabled ? "Coming soon" : "Open"}
    >
      {/* soft glass overlay */}
      <div className="absolute inset-0 bg-black/15" />

      {/* bonus badge */}
      {p.bonus ? (
        <div className="absolute top-3 left-3">
          <span className="pill">{p.bonus}</span>
        </div>
      ) : null}

      <div className="relative h-full p-5 flex flex-col justify-between">
        {/* center logo */}
        <div className="flex items-center justify-center pt-4">
          <div className="relative h-12 w-36">
            <Image
              src={logoSrc}
              alt={`${p.name} logo`}
              fill
              sizes="144px"
              className="object-contain drop-shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
              unoptimized={logoSrc.startsWith("data:image")}
            />
          </div>
        </div>

        {/* bottom name + stars */}
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-white font-extrabold leading-tight">
              {p.name}
            </div>
            <div className="mt-1">
              <Stars rating={p.rating ?? 4} />
            </div>
          </div>

          {/* coming soon tag */}
          {disabled ? (
            <div className="text-xs text-white/70 rounded-full border border-white/15 bg-white/5 px-3 py-1">
              Coming soon
            </div>
          ) : (
            <div className="text-xs text-white/70 rounded-full border border-white/15 bg-white/5 px-3 py-1">
              Open
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function SurveyCard({
  p,
  onOpen,
}: {
  p: Partner;
  onOpen: (p: Partner) => void;
}) {
  const disabled = !!p.comingSoon;
  const logoSrc = p.logo || svgLogoDataUri(p.name);

  return (
    <div className="card-glass p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <Image
              src={logoSrc}
              alt={`${p.name} logo`}
              fill
              sizes="48px"
              className="object-contain"
              unoptimized={logoSrc.startsWith("data:image")}
            />
          </div>

          <div>
            <div className="text-white font-extrabold text-lg leading-tight">
              {p.name}
            </div>
            <div className="mt-1 text-sm text-white/60">{p.subtitle || ""}</div>
            <div className="mt-2">
              <Stars rating={p.rating ?? 4} />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {p.badge ? <span className="pill">{p.badge}</span> : null}
          {disabled ? <span className="pill">Coming soon</span> : null}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="text-xs text-white/50">Surveys</div>
        <button
          type="button"
          onClick={() => onOpen(p)}
          disabled={disabled}
          className={[
            disabled ? "btn-ghost" : "btn-primary",
            "disabled:opacity-60",
          ].join(" ")}
        >
          {disabled ? "Unavailable" : "Open"}
        </button>
      </div>
    </div>
  );
}
