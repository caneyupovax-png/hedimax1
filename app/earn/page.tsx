"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const OFFERWALLS: Array<{ name: string; slug: string }> = [
  { name: "CPX Research", slug: "cpx" },
  { name: "AyetStudios", slug: "ayetstudios" },
  { name: "AdGate", slug: "adgate" },
  { name: "Lootably", slug: "lootably" },
  { name: "BitLabs", slug: "bitlabs" },
];

export default function EarnPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [username, setUsername] = useState("Guest");
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);

      // getUser() daha sağlam
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!alive) return;

      if (!user) {
        setIsAuthed(false);
        setUsername("Guest");
        setBalance(0);
        setLoading(false);
        return;
      }

      setIsAuthed(true);

      const name =
        (user.user_metadata as any)?.username ||
        (user.user_metadata as any)?.name ||
        (user.email ? String(user.email).split("@")[0] : "User");

      setUsername(String(name));

      const { data: pb } = await supabase
        .from("points_balance")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      setBalance(Number(pb?.balance ?? 0));
      setLoading(false);
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openOfferwall = async (slug: string) => {
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      router.push(`/login?next=/earn`);
      return;
    }

    // ✅ CPX: backend’den URL al, yeni sekmede aç
    if (slug === "cpx") {
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

    // diğer offerwall sayfaları
    router.push(`/offerwall/${slug}`);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      {!isAuthed && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-lg font-semibold text-white">
            You’re browsing as Guest
          </div>
          <div className="mt-1 text-sm text-white/70">
            Login to track points and open offerwalls.
          </div>
          <div className="mt-4">
            <Link
              href="/login?next=/earn"
              className="inline-flex rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
            >
              Login
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm text-white/60">Welcome</div>
          <div className="mt-1 text-2xl font-semibold text-white">
            Hi, <span className="text-emerald-400">{username}</span>
          </div>

          <div className="mt-6 text-sm text-white/60">Current balance</div>
          <div className="mt-2 text-5xl font-bold text-white">
            {loading ? "…" : balance}
          </div>
          <div className="text-white/60">coins</div>

          <div className="mt-5 text-xs text-white/40">
            Rate: <span className="text-white/70">1 USD = 1000 coins</span>
          </div>
        </section>

        <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div>
            <div className="text-lg font-semibold text-white">Offerwalls</div>
            <div className="text-sm text-white/60">
              Choose an offerwall to start earning coins.
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {OFFERWALLS.map((o) => (
              <button
                key={o.slug}
                onClick={() => openOfferwall(o.slug)}
                className="block w-full text-left rounded-2xl border border-white/10 bg-black/20 p-5 hover:border-white/20 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-base font-semibold text-white">
                    {o.name}
                  </div>
                  {o.slug === "cpx" && (
                    <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/20">
                      Recommended
                    </span>
                  )}
                </div>

                <div className="mt-1 text-sm text-white/60">
                  {o.slug === "cpx"
                    ? "Open CPX surveys & offers (new tab)"
                    : `Open ${o.name} offerwall`}
                </div>

                <div className="mt-4 inline-flex rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold">
                  Open
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
