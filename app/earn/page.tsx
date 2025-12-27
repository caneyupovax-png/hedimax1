"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type UserMini = {
  id: string;
  email?: string | null;
  user_metadata?: any;
};

const OFFERWALLS = [
  { name: "AyetStudios", slug: "ayetstudios" },
  { name: "AdGate", slug: "adgate" },
  { name: "Lootably", slug: "lootably" },
  { name: "BitLabs", slug: "bitlabs" },
];

export default function EarnPage() {
  const router = useRouter();

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, anon);
  }, []);

  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string>("User");
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!session?.user) {
        router.push("/login");
        return;
      }

      const u = session.user as any as UserMini;

      const name =
        u?.user_metadata?.username ||
        u?.user_metadata?.name ||
        (u?.email ? u.email.split("@")[0] : "User");

      setUsername(String(name));

      // points_balance -> balance
      const { data, error } = await supabase
        .from("points_balance")
        .select("balance")
        .eq("user_id", u.id)
        .single();

      if (!error && data?.balance != null) {
        setBalance(Number(data.balance));
      } else {
        setBalance(0);
      }

      setLoading(false);
    };

    run();
  }, [router, supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <main className="min-h-screen bg-black text-white">
      {/* TOP BAR */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="text-lg font-semibold">HEDIMAX</div>

            <nav className="hidden sm:flex items-center gap-6 text-sm text-white/70">
              <Link className="hover:text-white" href="/earn">
                Earn
              </Link>
              <Link className="hover:text-white" href="/cashout">
                Cashout
              </Link>
              <Link className="hover:text-white" href="/leaderboard">
                Leaderboard
              </Link>
              <Link className="hover:text-white" href="/rewards">
                Rewards
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Username + Balance (tıklanınca dashboard) */}
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 hover:border-white/20"
              title="Go to dashboard"
            >
              <span className="text-sm text-white/80">
                {loading ? "Loading..." : username}
              </span>
              <span className="mx-2 text-white/30">•</span>
              <span className="text-sm font-semibold">
                {loading ? "-" : balance} pts
              </span>
            </Link>

            <button
              onClick={logout}
              className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:opacity-90"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm text-white/60">Welcome</div>
            <div className="mt-1 text-2xl font-semibold">
              Hi, <span className="text-emerald-400">{username}</span>
            </div>

            <div className="mt-6 text-sm text-white/60">Current balance</div>
            <div className="mt-2 text-5xl font-bold">
              {loading ? "…" : balance}
            </div>
            <div className="text-white/60">points</div>

            <div className="mt-6 text-xs text-white/50">
              Click your username on the top-right to open the dashboard.
            </div>
          </section>

          {/* RIGHT – OFFERWALLS */}
          <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Offerwalls</div>
                <div className="text-sm text-white/60">
                  Choose an offerwall to start earning points.
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {OFFERWALLS.map((o) => (
                <Link
                  key={o.slug}
                  href={`/offerwall/${o.slug}`}
                  className="block rounded-2xl border border-white/10 bg-black/20 p-5 hover:border-white/20 transition"
                >
                  <div className="text-base font-semibold">{o.name}</div>
                  <div className="mt-1 text-sm text-white/60">
                    Open {o.name} offerwall
                  </div>
                  <div className="mt-4 inline-flex rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold">
                    Open
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
