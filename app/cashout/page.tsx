"use client";

import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const COINS = [
  { key: "BTC", label: "Bitcoin (BTC)" },
  { key: "LTC", label: "Litecoin (LTC)" },
  { key: "DOGE", label: "Dogecoin (DOGE)" },
] as const;

export default function CashoutPage() {
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, anon);
  }, []);

  const [coin, setCoin] = useState<(typeof COINS)[number]["key"]>("BTC");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    const addr = address.trim();
    const amt = Number(amount);

    if (!addr || addr.length < 8) return setErr("Please enter a valid address.");
    if (!Number.isFinite(amt) || amt <= 0) return setErr("Amount must be greater than 0.");

    setLoading(true);
    try {
      // ✅ Token'ı client session'dan al
      const { data } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;

      if (!accessToken) {
        throw new Error("You are not logged in. Please login again.");
      }

      const res = await fetch("/api/cashout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ coin, address: addr, amount: amt }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Cashout failed");

      setMsg("Withdrawal request submitted (pending).");
      setAddress("");
      setAmount("");
    } catch (e: any) {
      setErr(e?.message || "Cashout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-semibold">Cashout</h1>
        <p className="mt-2 text-white/70 text-sm">
          Withdraw via BTC, LTC or DOGE only.
        </p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/80 mb-2">Coin</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {COINS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCoin(c.key)}
                    className={[
                      "rounded-xl border px-4 py-3 text-sm text-left transition",
                      coin === c.key
                        ? "border-white/40 bg-white/10"
                        : "border-white/10 bg-black/20 hover:border-white/20",
                    ].join(" ")}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-2">
                Wallet address
              </label>
              <input
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-white/30"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={`Enter your ${coin} address`}
                autoComplete="off"
              />
              <div className="mt-1 text-xs text-white/50">
                Make sure the address matches the selected coin network.
              </div>
            </div>

            <div>
              <label className="block text-sm text-white/80 mb-2">Amount</label>
              <input
                className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-white/30"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
              />
            </div>

            {err && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {err}
              </div>
            )}
            {msg && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {msg}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-white text-black font-medium py-3 disabled:opacity-60"
            >
              {loading ? "Submitting..." : "Submit withdrawal"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
