"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Tx = {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
};

function formatTRNumber(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export default function DashboardPage() {
  const [email, setEmail] = useState<string>("");
  const [balance, setBalance] = useState<number>(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [claimLoading, setClaimLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const greeting = useMemo(() => {
    if (!email) return "Welcome back";
    const name = email.split("@")[0];
    return `Welcome back, ${name}`;
  }, [email]);

  async function loadAll() {
    setMsg("");
    setLoading(true);

    // user
    const { data: userData } = await supabase.auth.getUser();
    setEmail(userData.user?.email ?? "");

    // balance (tablon farklıysa hata olursa 0 gösterir)
    const { data: balData, error: balErr } = await supabase
      .from("points_balance")
      .select("balance")
      .single();

    if (balErr) setBalance(0);
    else setBalance(Number(balData?.balance ?? 0));

    // recent tx (tablon yoksa hata olur, o zaman boş bırakırız)
    const { data: txData } = await supabase
      .from("points_tx")
      .select("id,amount,reason,created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    setTxs(
      (txData ?? []).map((t: any) => ({
        id: String(t.id),
        amount: Number(t.amount ?? 0),
        reason: String(t.reason ?? "unknown"),
        created_at: String(t.created_at ?? ""),
      }))
    );

    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  async function claimTest() {
    setMsg("");
    setClaimLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setMsg("No session. Please sign in again.");
      setClaimLoading(false);
      return;
    }

    const res = await fetch("/api/points/claim", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 50,
        ref: `test_${Date.now()}`,
        reason: "task_complete",
      }),
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!res.ok) {
      setMsg(
        (json?.error as string) ||
          `API error (${res.status}). Response: ${text?.slice(0, 240) || "EMPTY"}`
      );
      setClaimLoading(false);
      return;
    }

    setMsg("✅ +50 points added");
    await loadAll();
    setClaimLoading(false);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-black/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white text-zinc-950 grid place-items-center font-bold">
              H
            </div>
            <div>
              <div className="text-sm text-zinc-400">Hedimax</div>
              <div className="text-base font-semibold">{greeting}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Home
            </a>
            <button
              onClick={signOut}
              className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-200"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Balance card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-1">
            <div className="text-sm text-zinc-400">Your balance</div>

            <div className="mt-2 flex items-end gap-2">
              <div className="text-5xl font-bold">
                {loading ? "…" : formatTRNumber(balance)}
              </div>
              <div className="pb-1 text-zinc-400">points</div>
            </div>

            <div className="mt-5 grid gap-2">
              <button
                onClick={claimTest}
                disabled={claimLoading}
                className="w-full rounded-xl bg-white py-2.5 font-medium text-zinc-950 hover:bg-zinc-200 disabled:opacity-60"
              >
                {claimLoading ? "Adding..." : "Test: Add +50 points"}
              </button>

              <button
                onClick={loadAll}
                disabled={loading}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm hover:bg-white/10 disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>

              {msg ? (
                <div className="mt-2 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-200 whitespace-pre-wrap">
                  {msg}
                </div>
              ) : null}
            </div>
          </div>

          {/* Recent activity */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-zinc-400">Recent activity</div>
                <div className="text-lg font-semibold">Latest transactions</div>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                {txs.length} shown
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <div className="grid grid-cols-12 bg-black/30 px-4 py-3 text-xs text-zinc-400">
                <div className="col-span-5">Reason</div>
                <div className="col-span-3">Amount</div>
                <div className="col-span-4 text-right">Date</div>
              </div>

              {loading ? (
                <div className="px-4 py-6 text-sm text-zinc-300">Loading…</div>
              ) : txs.length === 0 ? (
                <div className="px-4 py-6 text-sm text-zinc-300">
                  No transactions yet. Click <b>Test: Add +50 points</b> to create one (if API is set).
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {txs.map((t) => (
                    <div
                      key={t.id}
                      className="grid grid-cols-12 items-center px-4 py-3 text-sm"
                    >
                      <div className="col-span-5 text-zinc-100">
                        {t.reason}
                      </div>
                      <div className="col-span-3 font-semibold">
                        +{formatTRNumber(t.amount)}
                      </div>
                      <div className="col-span-4 text-right text-zinc-400">
                        {t.created_at ? new Date(t.created_at).toLocaleString("en-US") : "-"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-zinc-400">
              Uses <code className="rounded bg-black/30 px-1 py-0.5">points_balance</code> and{" "}
              <code className="rounded bg-black/30 px-1 py-0.5">points_tx</code> tables (optional).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
