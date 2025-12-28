"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function CashoutPage() {
  const supabase = createClient();

  const [coin, setCoin] = useState("USDT");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCashout() {
    setMsg("");
    setLoading(true);

    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes?.user) {
      setMsg("Login required");
      setLoading(false);
      return;
    }

    const { data: sessionRes } = await supabase.auth.getSession();
    const token = sessionRes?.session?.access_token;

    if (!token) {
      setMsg("Session expired");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/cashout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        coin: coin.toLowerCase(),
        address,
        amount,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMsg(json?.error || "Cashout failed");
      setLoading(false);
      return;
    }

    setMsg("Cashout request sent ✅");
    setAddress("");
    setAmount(0);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur">
        <h1 className="mb-6 text-center text-2xl font-semibold">
          Cashout
        </h1>

        <label className="text-sm text-white/70">Coin</label>
        <select
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/60 p-3 text-white outline-none"
          value={coin}
          onChange={(e) => setCoin(e.target.value)}
        >
          <option value="USDT">USDT</option>
          <option value="BTC">BTC</option>
          <option value="ETH">ETH</option>
        </select>

        <label className="mt-4 block text-sm text-white/70">
          Wallet address
        </label>
        <input
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/60 p-3 text-white outline-none"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <label className="mt-4 block text-sm text-white/70">
          Amount
        </label>
        <input
          type="number"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/60 p-3 text-white outline-none"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />

        <button
          onClick={handleCashout}
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-white py-3 font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Sending..." : "Withdraw"}
        </button>

        {msg && (
          <p className="mt-4 text-center text-sm text-white/80">
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
