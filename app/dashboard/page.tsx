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
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("en-US");
  } catch {
    return iso;
  }
}

function badgeFromReason(reason?: string | null) {
  const r = (reason ?? "").toLowerCase();
  if (r.includes("task"))
    return {
      label: "Task",
      cls: "bg-emerald-500/15 text-emerald-200 border-emerald-400/20",
    };
  if (r.includes("offer"))
    return {
      label: "Offer",
      cls: "bg-sky-500/15 text-sky-200 border-sky-400/20",
    };
  if (r.includes("cashout"))
    return {
      label: "Cashout",
      cls: "bg-amber-500/15 text-amber-200 border-amber-400/20",
    };
  return {
    label: reason ? "Other" : "Unknown",
    cls: "bg-white/10 text-zinc-200 border-white/10",
  };
}

export default function DashboardPage() {
  const [email, setEmail] = useState<string>("");
  const [balance, setBalance] = useState<number>(0);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [msg, setMsg] = useState<string>("");

  const username = useMemo(() => {
    if (!email) return "User";
    const part = email.split("@")[0] || "User";
    return part.length > 14 ? part.slice(0, 14) + "…" : part;
  }, [email]);

  async function loadDashboard() {
    setLoading(true);
    setMsg("");

    // user
    const { data: userData } = await supabase.auth.getUser();
    setEmail(userData.user?.email ?? "");

    // balance
    const { data: balData, error: balErr } = await supabase
      .from("points_balance")
      .select("balance")
      .single();

    if (balErr) setBalance(0);
    else setBalance(Number(balData?.balance ?? 0));

    // recent tx
    const { data: txData, error: txErr } = await supabase
      .from("points_tx")
      .select("id, amount, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (txErr) {
      setTxs([]);
    } else {
      setTxs(
        (txData ?? []).map((t: any) => ({
          id: String(t.id),
          amount: Number(t.amount ?? 0),
          reason: (t.reason ?? null) as string | null,
          created_at: String(t.created_at ?? ""),
        }))
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top Nav */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white text-zinc-950 grid place-items-center font-extrabold">
              H
            </div>
            <div className="leading-tight">
              <div className="text-sm text-zinc-400">Hedimax</div>
              <div className="text-base font-semibold">
                {loading ? "Loading..." : `Hi, ${username}`}
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <a
              href="/earn"
              className="rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 hover:bg-white/10"
            >
              Earn
            </a>
            <a
              href="/cashout"
              className="rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 hover:bg-white/10"
            >
              Cashout
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

      {/* Body */}
      <main className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Balance */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-sm text-zinc-400">Current Balance</div>

            <div className="mt-2 flex items-end gap-2">
              <div className="text-5xl font-extrabold tracking-tight">
                {loading ? "…" : formatNum(balance)}
              </div>
              <div className="pb-1 text-zinc-400">points</div>
            </div>

            <div className="mt-4 text-sm text-zinc-400">
              Earn points by completing tasks. Cash out when you reach the
              minimum.
            </div>

            <button
              onClick={loadDashboard}
              disabled={loading}
              className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm hover:bg-white/10 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            {msg ? (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3 text-sm text-zinc-200 whitespace-pre-wrap">
                {msg}
              </div>
            ) : null}
          </section>

          {/* Recent activity */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-zinc-400">Recent activity</div>
                <div className="text-lg font-semibold">Points history</div>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                {loading ? "…" : `${txs.length} shown`}
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
              <div className="grid grid-cols-12 bg-black/30 px-4 py-3 text-xs text-zinc-400">
                <div className="col-span-5">Type</div>
                <div className="col-span-3">Amount</div>
                <div className="col-span-4 text-right">Date</div>
              </div>

              {loading ? (
                <div className="px-4 py-6 text-sm text-zinc-300">Loading…</div>
              ) : txs.length === 0 ? (
                <div className="px-4 py-6 text-sm text-zinc-300">
                  No activity yet.
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {txs.map((t) => {
                    const badge = badgeFromReason(t.reason);
                    return (
                      <div
                        key={t.id}
                        className="grid grid-cols-12 items-center px-4 py-3 text-sm"
                      >
                        <div className="col-span-5 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-zinc-200">
                            {t.reason ?? "—"}
                          </span>
                        </div>

                        <div className="col-span-3 font-semibold">
                          +{formatNum(t.amount)}
                        </div>

                        <div className="col-span-4 text-right text-zinc-400">
                          {formatDate(t.created_at)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-4 text-xs text-zinc-400">
              Transactions are read from{" "}
              <code className="rounded bg-black/30 px-1 py-0.5">
                points_tx
              </code>{" "}
              and balance from{" "}
              <code className="rounded bg-black/30 px-1 py-0.5">
                points_balance
              </code>
              .
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
