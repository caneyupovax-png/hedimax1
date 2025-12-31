"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";

type Accent = "cyan" | "red" | "teal" | "green";

type ProviderCard = {
  key: string;
  name: string;
  accent: Accent;
  status: "coming" | "live";
  note?: string;
};

function AccentBar({ accent }: { accent: Accent }) {
  const map: Record<Accent, string> = {
    cyan: "from-cyan-400/80 to-cyan-400/0",
    red: "from-red-400/80 to-red-400/0",
    teal: "from-teal-300/80 to-teal-300/0",
    green: "from-emerald-400/80 to-emerald-400/0",
  };

  return <div className={`h-[3px] w-full rounded-full bg-gradient-to-r ${map[accent]}`} />;
}

function CardShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl bg-white/[0.02] backdrop-blur-2xl",
        "shadow-[0_30px_80px_rgba(0,0,0,0.35)]",
        "ring-1 ring-white/10",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white/[0.03] ring-1 ring-white/10 px-3 py-1 text-xs text-white/70">
      {children}
    </span>
  );
}

export default function EarnPage() {
  const providers: ProviderCard[] = [
    { key: "lootably", name: "Lootably", accent: "cyan", status: "coming", note: "Coming soon" },
    { key: "mmwall", name: "MM Wall", accent: "red", status: "coming", note: "Coming soon" },
    { key: "adgate", name: "AdGate", accent: "teal", status: "coming", note: "Coming soon" },
  ];

  return (
    <div className="min-h-screen w-full text-white relative overflow-hidden bg-[#070A12]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_18%_12%,rgba(130,160,255,0.16),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_88%_30%,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_110%,rgba(120,255,220,0.07),transparent_65%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/75" />
      </div>

      {/* ✅ Earn’e özel container: sayfa full width, içerik düzenli */}
      <div className="relative z-10 px-6 lg:px-10 py-10">
        <div className="mx-auto w-full max-w-7xl">
          {/* Header */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Earn</h1>
              <p className="mt-1 text-sm text-white/60">
                Complete offers and surveys to earn coins.
              </p>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button
                className="h-10 w-10 rounded-2xl bg-white/[0.03] ring-1 ring-white/10 hover:bg-white/[0.06] transition"
                type="button"
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                className="h-10 w-10 rounded-2xl bg-white/[0.03] ring-1 ring-white/10 hover:bg-white/[0.06] transition"
                type="button"
                aria-label="Next"
              >
                ›
              </button>
            </div>
          </div>

          {/* Providers */}
          <div className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Providers</h2>
              <Pill>Offerwalls</Pill>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-5">
              {providers.map((p) => (
                <CardShell key={p.key} className="p-5">
                  <AccentBar accent={p.accent} />

                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white/[0.05] ring-1 ring-white/10 flex items-center justify-center font-bold">
                      {p.name
                        .split(" ")
                        .map((x) => x[0])
                        .slice(0, 2)
                        .join("")}
                    </div>

                    <div className="flex-1">
                      <div className="text-lg font-bold">{p.name}</div>
                      <div className="text-xs text-white/45">{p.note}</div>
                    </div>

                    <span className="text-xs text-white/60 rounded-full bg-white/[0.03] ring-1 ring-white/10 px-3 py-1">
                      Soon
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled
                    className="mt-5 w-full rounded-2xl bg-white/[0.04] ring-1 ring-white/10 text-white/45 py-3 font-semibold cursor-not-allowed"
                  >
                    Coming soon
                  </button>
                </CardShell>
              ))}
            </div>
          </div>

          {/* Survey Partners */}
          <div className="mt-10">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Survey Partners</h2>
              <Pill>Surveys</Pill>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* CPX Research */}
              <CardShell className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white/[0.05] ring-1 ring-white/10 flex items-center justify-center">
                      <span className="text-base font-black">CPX</span>
                    </div>
                    <div>
                      <div className="text-lg font-extrabold tracking-tight">CPX RESEARCH</div>
                      <div className="text-xs text-white/50">High quality surveys</div>
                    </div>
                  </div>

                  <Link
                    href="/offerwall"
                    className="rounded-2xl bg-emerald-400 text-black px-5 py-3 font-semibold hover:opacity-90 transition"
                  >
                    Open
                  </Link>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/30 px-3 py-1 text-xs">
                    Recommended
                  </span>
                  <span className="text-xs text-white/45">
                    Earn coins instantly after completion.
                  </span>
                </div>
              </CardShell>

              {/* Placeholder partner (future) */}
              <CardShell className="p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-white/[0.05] ring-1 ring-white/10 flex items-center justify-center">
                      <span className="text-base font-black">+</span>
                    </div>
                    <div>
                      <div className="text-lg font-extrabold tracking-tight">More partners</div>
                      <div className="text-xs text-white/50">Coming soon</div>
                    </div>
                  </div>

                  <span className="rounded-2xl bg-white/[0.04] ring-1 ring-white/10 px-5 py-3 text-sm text-white/50">
                    Soon
                  </span>
                </div>

                <div className="mt-4 text-xs text-white/45">
                  We’ll add more survey providers here.
                </div>
              </CardShell>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
