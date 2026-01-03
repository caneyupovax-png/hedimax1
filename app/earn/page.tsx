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
    toastTimer.current = window.setTimeout(() => setToast(""), 2200);
  };

  const providers: Provider[] = [
    { name: "Lootably", slug: "lootably", color: "#22d3ee", comingSoon: true },
    { name: "MM Wall", slug: "mmwall", color: "#ef4444", comingSoon: true },
    { name: "AdGate", slug: "adgate", color: "#2dd4bf", comingSoon: true },
  ];

  const requireAuth = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login?next=/earn");
      return null;
    }
    return data.user;
  };

  /* ---------------- NOTIK ---------------- */
  const openNotik = async () => {
    const user = await requireAuth();
    if (!user) return;

    const appId = process.env.NEXT_PUBLIC_NOTIK_APP_ID;
    const pubId = process.env.NEXT_PUBLIC_NOTIK_PUB_ID;

    if (!appId || !pubId) {
      showToast("Missing Notik ENV");
      return;
    }

    const url =
      `https://notik.me/offerwall/` +
      `?app_id=${encodeURIComponent(appId)}` +
      `&pub_id=${encodeURIComponent(pubId)}` +
      `&user_id=${encodeURIComponent(user.id)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  /* ---------------- CPX ---------------- */
  const openCPX = async () => {
    const user = await requireAuth();
    if (!user) return;

    const res = await fetch(`/api/offerwall/cpx?user_id=${user.id}`);
    const json = await res.json().catch(() => ({} as any));

    if (json?.url) {
      window.open(json.url, "_blank", "noopener,noreferrer");
    } else {
      showToast("Failed to open CPX");
    }
  };

  /* ---------------- GEMIWALL ---------------- */
  const openGemiWall = async () => {
    const user = await requireAuth();
    if (!user) return;

    const placementId = process.env.NEXT_PUBLIC_GEMIWALL_PLACEMENT_ID;
    if (!placementId) {
      showToast("Missing GemiWall ENV");
      return;
    }

    const url = `https://gemiwall.com/${encodeURIComponent(
      placementId
    )}/${encodeURIComponent(user.id)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  /* ---------------- ADSWED ---------------- */
  const openAdsWed = async () => {
    const user = await requireAuth();
    if (!user) return;

    const url = `https://adswedmedia.com/offer/Pn0Zz9/${encodeURIComponent(
      user.id
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
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
          <h1 className="text-3xl font-extrabold tracking-tight">Earn</h1>
          <p className="mt-1 text-sm text-white/60">
            Complete offers and surveys to earn coins.
          </p>

          {/* PROVIDERS */}
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4">Offerwalls</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* NOTIK */}
              <div
                onClick={openNotik}
                className="group cursor-pointer rounded-3xl bg-white/[0.02] ring-1 ring-white/10 backdrop-blur-xl p-5 transition hover:ring-indigo-400/40"
              >
                <div className="h-[3px] w-full rounded-full bg-indigo-400" />
                <div className="mt-3">
                  <span className="rounded-full bg-indigo-400/10 text-indigo-200 px-2.5 py-1 text-[10px] font-semibold">
                    NEW
                  </span>
                </div>
                <div className="mt-4 rounded-2xl bg-white ring-1 ring-black/5 h-20 flex items-center justify-center font-extrabold text-black">
                  NOTIK
                </div>
                <div className="mt-3 text-xs text-white/50">
                  Complete offers and earn coins.
                </div>
              </div>

              {/* ADSWED */}
              <div onClick={openAdsWed} className="cursor-pointer rounded-3xl bg-white/[0.02] ring-1 ring-white/10 p-5">
                <div className="h-[3px] bg-sky-400 rounded-full" />
                <div className="mt-4 text-center font-bold">ADSWED</div>
              </div>

              {/* GEMIWALL */}
              <div onClick={openGemiWall} className="cursor-pointer rounded-3xl bg-white/[0.02] ring-1 ring-white/10 p-5">
                <div className="h-[3px] bg-emerald-400 rounded-full" />
                <div className="mt-4 text-center font-bold">GEMIWALL</div>
              </div>

              {providers.map((p) => (
                <div
                  key={p.slug}
                  className="rounded-3xl bg-white/[0.02] ring-1 ring-white/10 p-5 opacity-50"
                >
                  <div className="h-[3px] rounded-full" style={{ background: p.color }} />
                  <div className="mt-4 text-sm">{p.name} (Coming soon)</div>
                </div>
              ))}
            </div>
          </div>

          {/* SURVEYS */}
          <div className="mt-14">
            <h2 className="text-xl font-bold mb-4">Surveys</h2>
            <div className="rounded-3xl bg-white/[0.02] ring-1 ring-white/10 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image src="/partners/cpx.png" alt="CPX" width={44} height={44} />
                <div>
                  <div className="font-bold">CPX Research</div>
                  <div className="text-xs text-white/50">High quality surveys</div>
                </div>
              </div>
              <button
                onClick={openCPX}
                className="rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-black"
              >
                Open
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
