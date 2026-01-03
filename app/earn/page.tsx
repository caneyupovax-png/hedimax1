"use client";
export const dynamic = "force-dynamic";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Provider = {
  name: string;
  slug: string;
  color: string;
  comingSoon?: boolean;
};

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

  const providers: Provider[] = [
    { name: "Lootably", slug: "lootably", color: "#22d3ee", comingSoon: true },
    { name: "MM Wall", slug: "mmwall", color: "#ef4444", comingSoon: true },
    { name: "AdGate", slug: "adgate", color: "#2dd4bf", comingSoon: true },
  ];

  const openCPX = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login?next=/earn");
      return;
    }

    const res = await fetch(`/api/offerwall/cpx?user_id=${data.user.id}`);
    const json = await res.json().catch(() => ({} as any));

    if (json?.url) {
      window.open(json.url, "_blank", "noopener,noreferrer");
    } else {
      showToast("Failed to open CPX");
    }
  };

  const openGemiWall = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login?next=/earn");
      return;
    }

    const placementId = process.env.NEXT_PUBLIC_GEMIWALL_PLACEMENT_ID;
    if (!placementId) {
      showToast("Missing env: NEXT_PUBLIC_GEMIWALL_PLACEMENT_ID");
      return;
    }

    const url = `https://gemiwall.com/${encodeURIComponent(
      placementId
    )}/${encodeURIComponent(data.user.id)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openNotik = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login?next=/earn");
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_NOTIK_API_KEY;
    const appId = process.env.NEXT_PUBLIC_NOTIK_APP_ID;
    const pubId = process.env.NEXT_PUBLIC_NOTIK_PUB_ID;

    if (!apiKey || !appId || !pubId) {
      showToast(
        "Missing env: NEXT_PUBLIC_NOTIK_API_KEY / NEXT_PUBLIC_NOTIK_APP_ID / NEXT_PUBLIC_NOTIK_PUB_ID"
      );
      return;
    }

    const url = `https://notik.me/coins?api_key=${encodeURIComponent(
      apiKey
    )}&app_id=${encodeURIComponent(appId)}&pub_id=${encodeURIComponent(
      pubId
    )}&user_id=${encodeURIComponent(data.user.id)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen w-full text-white relative overflow-hidden">
      {/* ✅ BACKGROUND IMAGE */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/bg.png)" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-black/70" />

      {/* Toast */}
      {toast ? (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60]">
          <div className="rounded-2xl bg-black/70 ring-1 ring-white/15 backdrop-blur px-4 py-2 text-sm text-white">
            {toast}
          </div>
        </div>
      ) : null}

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Earn
            </h1>
            <p className="mt-2 text-white/60 text-sm md:text-base">
              Complete surveys and offers to earn coins.
            </p>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT - How it works */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl bg-white/[0.02] ring-1 ring-white/10 backdrop-blur-xl p-6">
              <div className="text-sm font-semibold text-white/80">
                How it works
              </div>
              <p className="mt-3 text-sm text-white/60 leading-relaxed">
                Choose a provider, complete offers/surveys, and your coins will
                be credited automatically after completion.
              </p>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl bg-white/[0.02] ring-1 ring-white/10 p-4">
                  <div className="text-sm font-semibold">No VPN / Bots</div>
                  <div className="mt-1 text-xs text-white/55">
                    Use real traffic and real devices to avoid holds.
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.02] ring-1 ring-white/10 p-4">
                  <div className="text-sm font-semibold">Be consistent</div>
                  <div className="mt-1 text-xs text-white/55">
                    Don’t create multiple accounts. It may lead to bans.
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.02] ring-1 ring-white/10 p-4">
                  <div className="text-sm font-semibold">Need help?</div>
                  <div className="mt-1 text-xs text-white/55">
                    If something doesn’t credit, contact support.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT - Providers */}
          <div className="lg:col-span-2">
            {/* Surveys */}
            <div className="rounded-3xl bg-white/[0.02] ring-1 ring-white/10 backdrop-blur-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white/80">
                    Surveys
                  </div>
                  <p className="mt-2 text-xs text-white/60">
                    Answer surveys and get rewarded instantly.
                  </p>
                </div>
                <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                  CPX
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="group rounded-3xl bg-white/[0.02] ring-1 ring-white/10 backdrop-blur-xl p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 rounded-xl bg-white overflow-hidden ring-1 ring-white/15">
                        <Image
                          src="/partners/cpx.png"
                          alt="CPX Research"
                          fill
                          className="object-contain p-1"
                          priority
                        />
                      </div>
                      <div>
                        <div className="font-extrabold tracking-tight">
                          CPX RESEARCH
                        </div>
                        <div className="text-xs text-white/45">
                          Surveys &amp; profiling
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={openCPX}
                      className="rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-black transition hover:opacity-95"
                    >
                      Open
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl bg-white/[0.02] ring-1 ring-white/10 backdrop-blur-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-white/[0.05] ring-1 ring-white/10 flex items-center justify-center font-bold">
                        +
                      </div>
                      <div>
                        <div className="font-semibold">More partners</div>
                        <div className="text-xs text-white/45">Coming soon</div>
                      </div>
                    </div>

                    <span className="rounded-full bg-white/[0.03] px-4 py-2 text-xs text-white/50 ring-1 ring-white/10">
                      Soon
                    </span>
                  </div>

                  <div className="mt-5 w-full rounded-2xl bg-white/[0.03] ring-1 ring-white/10 py-3 text-center text-sm text-white/40">
                    Coming soon
                  </div>
                </div>
              </div>
            </div>

            {/* PROVIDERS */}
            <div className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Providers</h2>
                <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs text-white/70">
                  Offerwalls
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* NOTIK */}
                <div
                  onClick={openNotik}
                  className="
                    group cursor-pointer
                    rounded-3xl bg-white/[0.02]
                    ring-1 ring-white/10 backdrop-blur-xl p-5
                    transition
                    hover:bg-white/[0.035]
                    hover:ring-fuchsia-400/40
                  "
                >
                  <div className="h-[3px] w-full rounded-full bg-fuchsia-400/80" />

                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-extrabold tracking-tight">
                          NOTIK
                        </div>
                        <span className="text-[10px] font-semibold tracking-wide text-black rounded-full bg-fuchsia-400 px-2 py-0.5">
                          NEW
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-white/50">
                        Complete offers and earn coins.
                      </div>
                    </div>

                    <div className="rounded-2xl bg-fuchsia-400 px-5 py-3 font-semibold text-black transition group-hover:opacity-95">
                      Open
                    </div>
                  </div>
                </div>

                {/* GEMIWALL */}
                <div
                  onClick={openGemiWall}
                  className="
                    group cursor-pointer
                    rounded-3xl bg-white/[0.02]
                    ring-1 ring-white/10 backdrop-blur-xl p-5
                    transition
                    hover:bg-white/[0.035]
                    hover:ring-emerald-400/40
                  "
                >
                  <div className="h-[3px] w-full rounded-full bg-emerald-400/80" />

                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-extrabold tracking-tight">
                        GEMIWALL
                      </div>

                      <div className="mt-4 rounded-2xl bg-white ring-1 ring-black/5 overflow-hidden">
                        <div className="relative h-20 w-full">
                          <Image
                            src="/partners/gemiwall.png"
                            alt="GemiWall"
                            fill
                            className="object-contain p-3"
                            priority
                          />
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-white/50">
                        Complete offers and earn coins.
                      </div>
                    </div>

                    <div className="rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-black transition group-hover:opacity-95">
                      Open
                    </div>
                  </div>
                </div>

                {/* Other providers */}
                {providers.map((p) => (
                  <div
                    key={p.slug}
                    className="rounded-3xl bg-white/[0.02] ring-1 ring-white/10 backdrop-blur-xl p-5"
                  >
                    <div
                      className="h-[3px] w-full rounded-full"
                      style={{ background: p.color }}
                    />

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/[0.05] ring-1 ring-white/10 flex items-center justify-center font-bold">
                          {p.name?.slice(0, 1) || "?"}
                        </div>
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          <div className="text-xs text-white/45">
                            Coming soon
                          </div>
                        </div>
                      </div>

                      <span className="text-xs text-white/50 rounded-full bg-white/[0.03] px-3 py-1 ring-1 ring-white/10">
                        Soon
                      </span>
                    </div>

                    <div className="mt-5 w-full rounded-2xl bg-white/[0.03] ring-1 ring-white/10 py-3 text-center text-sm text-white/40">
                      Coming soon
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
