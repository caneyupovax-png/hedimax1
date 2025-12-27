"use client";

import { useEffect, useState } from "react";
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

export default function DashboardPage() {
  const [username, setUsername] = useState("User");
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const metaUsername =
      userData.user?.user_metadata?.username ||
      userData.user?.email?.split("@")[0] ||
      "User";
    setUsername(metaUsername);

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

  return (
    <div className="min-h-screen bg-[#070a0f] text-white">
      <main className="mx-auto max-w-6xl px-6 py-8 grid gap-6 lg:grid-cols-3">
        {/* BALANCE */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="text-sm text-white/60">Welcome</div>
          <div className="mt-1 text-xl font-semibold">
            Hi, <span className="text-emerald-400">{username}</span>
          </div>

          <div className="mt-6 text-sm text-white/60">Current balance</div>
          <div className="mt-2 text-5xl font-bold">
            {loading ? "…" : formatNum(balance)}
          </div>
          <div className="text-white/60 mt-1">points</div>
        </section>

        {/* HISTORY */}
        <section className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-4">
            <div className="text-sm text-white/60">Recent activity</div>
            <div className="text-lg font-semibold">Points history</div>
          </div>

          <div className="border border-white/10 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 bg-black/30 px-4 py-2 text-xs text-white/60">
              <div className="col-span-5">Type</div>
              <div className="col-span-3">Amount</div>
              <div className="col-span-4 text-right">Date</div>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-white/60">Loading…</div>
            ) : txs.length === 0 ? (
              <div className="p-6 text-sm text-white/60">No activity yet.</div>
            ) : (
              <div className="divide-y divide-white/10">
                {txs.map((t) => (
                  <div key={t.id} className="grid grid-cols-12 px-4 py-3 text-sm">
                    <div className="col-span-5">{t.reason || "Other"}</div>
                    <div className="col-span-3 font-semibold">
                      +{formatNum(t.amount)}
                    </div>
                    <div className="col-span-4 text-right text-white/60">
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
