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
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 2500);
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
      showToast(json?.error || "Failed to open CPX");
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

  const openAdsWed = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login?next=/earn");
      return;
    }

    const url = `https://adswedmedia.com/offer/Pn0Zz9/${encodeURIComponent(
      data.user.id
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openNotik = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login?next=/earn");
      return;
    }

    const res = await fetch(`/api/offerwall/notik?user_id=${data.user.id}`);
    const json = await res.json().catch(() => ({} as any));

    if (json?.url) {
      window.open(json.url, "_blank", "noopener,noreferrer");
      return;
    }

    showToast(json?.error || "Failed to open Notik");
  };

  return (
    <div className="min-h-screen w-full text-white relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/bg/earn-bg.png')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-black/85" />

      {toast && (
        <div className="fixed top-24 right-6 z-50">
          <div className="rounded-xl bg-black/70 ring-1 ring-white/10 px-4 py-3 text-sm">
            {toast}
          </div>
        </div>
      )}

      <div className="relative z-10 px-6 lg:px-10 py-10">
        <div className="mx-auto w-full max-w-7xl">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Earn</h1>
            <p className="mt-1 text-sm text-white/60">
              Complete offers and surveys to earn coins.
            </p>
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
                  hover:ring-indigo-400/40
                "
              >
                <div className="h-[3px] w-full rounded-full bg-indigo-400/80" />
                <div className="mt-3">
                  <span className="rounded-full bg-indigo-400/10 text-indigo-200 px-2.5 py-1 text-[10px] font-semibold ring-1 ring-indigo-400/25">
                    NEW
                  </span>
                </div>
                <div className="mt-4 rounded-2xl bg-white ring-1 ring-black/5 overflow-hidden">
                  <div className="relative h-20 w-full flex items-center justify-center">
                    <span className="text-black font-extrabold tracking-tight">
                      NOTIK
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-white/50">
                  Complete offers and earn coins.
                </div>
              </div>

              {/* ADSWED */}
              <div
                onClick={openAdsWed}
                className="
                  group cursor-pointer
                  rounded-3xl bg-white/[0.02]
                  ring-1 ring-white/10 backdrop-blur-xl p-5
                  transition
                  hover:bg-white/[0.035]
                  hover:ring-sky-400/40
                "
              >
                <div className="h-[3px] w-full rounded-full bg-sky-400/80" />
                <div className="mt-3">
                  <span className="rounded-full bg-sky-400/10 text-sky-200 px-2.5 py-1 text-[10px] font-semibold ring-1 ring-sky-400/25">
                    NEW
                  </span>
                </div>
                <div className="mt-4 rounded-2xl bg-white ring-1 ring-black/5 overflow-hidden">
                  <div className="relative h-20 w-full flex items-center justify-center">
                    <span className="text-black font-extrabold tracking-tight">
                      ADSWED
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-white/50">
                  Complete offers and earn coins.
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
                <div className="mt-3">
                  <span className="rounded-full bg-emerald-400/10 text-emerald-200 px-2.5 py-1 text-[10px] font-semibold ring-1 ring-emerald-400/25">
                    NEW
                  </span>
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
                        {p.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-xs text-white/45">Coming soon</div>
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

          {/* SURVEYS */}
          <div className="mt-14">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Survey Partners</h2>
              <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs text-white/70">
