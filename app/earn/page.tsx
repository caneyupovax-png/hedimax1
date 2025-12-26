"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Offerwall = {
  key: string;
  name: string;
  desc: string;
  badge: string;
};

const OFFERWALLS: Offerwall[] = [
  { key: "bitlabs", name: "BitLabs", desc: "Surveys + offers. Fast payouts.", badge: "Top" },
  { key: "ayet", name: "AyetStudios", desc: "Mobile app installs + signups.", badge: "Apps" },
  { key: "adgem", name: "AdGem", desc: "Offers + surveys. Big variety.", badge: "Offers" },
  { key: "cpx", name: "CPX Research", desc: "Survey wall. Good fill rate.", badge: "Surveys" },
];

export default function EarnPage() {
  const [email, setEmail] = useState<string>("");

  const username = useMemo(() => {
    if (!email) return "User";
    const part = email.split("@")[0] || "User";
    return part.length > 14 ? part.slice(0, 14) + "…" : part;
  }, [email]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "");
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white text-zinc-950 grid place-items-center font-extrabold">
              H
            </div>
            <div className="leading-tight">
              <div className="text-sm text-zinc-400">Hedimax</div>
              <div className="text-base font-semibold">Earn • Hi, {username}</div>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <a
              href="/earn"
              className="rounded-xl px-3 py-2 text-sm bg-white/10 border border-white/10 hover:bg-white/15"
            >
              Earn
            </a>
            <a
              href="/cashout"
              className="rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 hover:bg-white/10"
            >
              Cashout
            </a>
            <a
              href="/dashboard"
              className="rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 hover:bg-white/10"
            >
              Dashboard
            </a>
            <button
              onClick={signOut}
              className="rounded-xl px-3 py-2 text-sm bg-white text-zinc-950 font-medium hover:bg-zinc-200"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        <div>
          <h1 className="text-2xl font-semibold">Offerwalls</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Pick an offerwall to start earning points.
          </p>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {OFFERWALLS.map((ow) => (
            <a
              key={ow.key}
              href={`/offerwall?provider=${encodeURIComponent(ow.key)}`}
              className="text-left rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-lg font-semibold">{ow.name}</div>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-xs text-zinc-300">
                  {ow.badge}
                </span>
              </div>

              <div className="mt-2 text-sm text-zinc-400">{ow.desc}</div>

              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-200">
                  Active
                </span>
                <span className="text-xs text-zinc-400">Open →</span>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
