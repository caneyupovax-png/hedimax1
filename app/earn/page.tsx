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

  return (
    <div className="min-h-screen w-full bg-[#070A12] text-white relative overflow-hidden">
      {/* background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_18%_12%,rgba(130,160,255,0.16),transparent_62%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/80" />
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed top-24 right-6 z-50">
          <div className="rounded-xl bg-black/70 ring-1 ring-white/10 px-4 py-3 text-sm">
            {toast}
          </div>
        </div>
      )}

      <div className="relative z-10 px-6 lg:px-10 py-10">
        <div className="mx-auto w-full max-w-7xl">
          {/* header */}
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
              {providers.map((p) => (
                <div
                  key={p.slug}
                  className="rounded-3xl bg-white/[0.02] ring-1 ring-white/10 backdrop-blur-xl p-5"
                >
                  <div className="h-[3px] w-full rounded-full" style={{ background: p.color }} />

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
                Surveys
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CPX */}
              <div
                className={[
                  "group rounded-3xl bg-white/[0.02] ring-1 ring-white/10 backdrop-blur-xl p-6",
                  "transition hover:bg-white/[0.03] hover:ring-white/15",
                ].join(" ")}
              >
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
                      <div className="font-extrabold tracking-tight">CPX RESEARCH</div>
                      <div className="text-xs text-white/50">High quality surveys</div>
                    </div>
                  </div>

                  {/* ✅ HER ZAMAN GÖZÜKÜR */}
                  <button
                    type="button"
                    onClick={openCPX}
                    className={[
                      "rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-black",
                      "transition",
                      // ✅ hover’da basılabilir olduğu belli olsun
                      "group-hover:scale-[1.03] group-hover:shadow-[0_12px_40px_rgba(16,185,129,0.35)]",
                      "hover:opacity-95",
                      // ✅ slash/çizgi olmasın
                      "focus:outline-none focus-visible:outline-none active:scale-[0.99]",
                      // ✅ imleç
                      "cursor-pointer",
                    ].join(" ")}
                  >
                    Open
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="rounded-full bg-emerald-400/15 text-emerald-200 px-3 py-1 text-xs ring-1 ring-emerald-400/30">
                    Recommended
                  </span>
                  <span className="text-xs text-white/45">
                    Earn coins instantly after completion.
                  </span>
                </div>
              </div>

              {/* MORE */}
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
import Link from "next/link";

<Link href="/gemiwall" className="btn-primary">
  Open GemiWall
</Link>


                <div className="mt-5 w-full rounded-2xl bg-white/[0.03] ring-1 ring-white/10 py-3 text-center text-sm text-white/40">
                  Coming soon
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
