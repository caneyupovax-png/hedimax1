"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Tx = {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
};

function formatNum(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US");
  } catch {
    return iso;
  }
}

function badge(reason?: string | null) {
  const r = (reason ?? "").toLowerCase();
  if (r.includes("task")) return "Task";
  if (r.includes("offer")) return "Offer";
  if (r.includes("cashout")) return "Cashout";
  return "Other";
}

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  const username = useMemo(() => {
    if (!email) return "User";
    return email.split("@")[0];
  }, [email]);

  async function load() {
    setLoading(true);

    const { data: user } = await supabase.auth.getUser();
    setEmail(user.user?.email ?? "");

    const { data: bal } = await supabase
      .from("points_balance")
      .select("balance")
      .single();

    setBalance(Number(bal?.balance ?? 0));

    const { data: list } = await supabase
      .from("points_tx")
      .select("id, amount, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    setTxs((list ?? []) as Tx[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* NAVBAR */}
      <header className="border-b border-white/10 bg-black/40">
        <div className="mx-auto max-w-6xl px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white text-black font-bold flex items-center justify-center">
              H
            </div>
            <div>
              <div className="text-sm text-zinc-400">Hedimax</div>
              <div className="font-semibold">Hi, {username}</div>
            </div>
          </div>

          <nav className="flex gap-2">
            <a href="/earn" className="px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">
              Earn
            </a>
            <a href="/cashout" className="px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">
              Cashout
            </a>
            <button
              onClick={signOut}
              className="px-3 py-2 text-sm rounded-lg bg-white text-black font-medium hover:bg-zinc-200"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      {/* CONTENT */}
      <main className="mx-auto max-w-6xl px-6 py-8 grid gap-6 lg:grid-cols-3">
        {/* BALANCE */}
        <section className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <div className="text-sm text-zinc-400">Current balance</div>
          <div className="mt-2 text-5xl font-bold">
            {loading ? "…" : formatNum(balance)}
          </div>
          <div className="text-zinc-400 mt-1">points</div>

          <button
            onClick={load}
            className="mt-5 w-full py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm"
          >
            Refresh
          </button>
        </section>

        {/* HISTORY */}
        <section className="lg:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-6">
          <div className="mb-4">
            <div className="text-sm text-zinc-400">Recent activity</div>
            <div className="text-lg font-semibold">Points history</div>
          </div>

          <div className="border border-white/10 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 bg-black/30 px-4 py-2 text-xs text-zinc-400">
              <div className="col-span-5">Type</div>
              <div className="col-span-3">Amount</div>
              <div className="col-span-4 text-right">Date</div>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-zinc-300">Loading…</div>
            ) : txs.length === 0 ? (
              <div className="p-6 text-sm text-zinc-300">No activity yet.</div>
            ) : (
              <div className="divide-y divide-white/10">
                {txs.map((t) => (
                  <div key={t.id} className="grid grid-cols-12 px-4 py-3 text-sm">
                    <div className="col-span-5">{badge(t.reason)}</div>
                    <div className="col-span-3 font-semibold">
                      +{formatNum(t.amount)}
                    </div>
                    <div className="col-span-4 text-right text-zinc-400">
                      {formatDate(t.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
