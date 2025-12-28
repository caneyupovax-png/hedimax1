// app/cashout/page.tsx
"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Coin = "USDT" | "BTC" | "ETH";

export default function CashoutPage() {
  const supabase = useMemo(() => createClient(), []);

  const [coin, setCoin] = useState<Coin>("USDT");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function handleCashout() {
    setMsg("");
    setLoading(true);

    try {
      // 1) user var mı?
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData?.user) {
        setMsg("Not logged in (no user).");
        return;
      }

      // 2) session + token
      const { data: sessionData, error: sessionErr } =
        await supabase.auth.getSession();

      const token = sessionData?.session?.access_token ?? null;

      // ✅ Debug: Vercel’de bunu Console’dan göreceğiz
      console.log("TOKEN LEN:", token?.length || 0);
      console.log("HAS SESSION:", !!sessionData?.session);
      console.log("USER ID:", userData.user.id);

      if (sessionErr) {
        console.log("SESSION ERROR:", sessionErr);
      }

      if (!token) {
        setMsg("No access token in session (TOKEN LEN: 0).");
        return;
      }

      // 3) basic validation
      if (!address.trim()) {
        setMsg("Address is required.");
        return;
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        setMsg("Amount must be > 0.");
        return;
      }

      // 4) API call
      const res = await fetch("/api/cashout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coin,
          address: address.trim(),
          amount: Number(amount),
        }),
      });

      let json: any = {};
      try {
        json = await res.json();
      } catch {
        json = {};
      }

      // ✅ Debug: API cevabı da Console’dan görünsün
      console.log("CASHOUT STATUS:", res.status);
      console.log("CASHOUT JSON:", json);

      if (!res.ok) {
        setMsg(json?.error || `Cashout failed (HTTP ${res.status})`);
        return;
      }

      setMsg("Cashout request submitted successfully ✅");
      setAddress("");
      setAmount(0);
    } catch (e: any) {
      console.log("CASHOUT ERROR:", e);
      setMsg(e?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-white">Cashout</h1>
      <p className="mt-2 text-sm text-white/70">
        Vercel debug için Console’a bak: <b>TOKEN LEN</b>, <b>CASHOUT STATUS</b>,
        <b>CASHOUT JSON</b>
      </p>

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 shadow">
        <label className="block text-sm text-white/80">Coin</label>
        <select
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none"
          value={coin}
          onChange={(e) => setCoin(e.target.value as Coin)}
          disabled={loading}
        >
          <option value="USDT">USDT</option>
          <option value="BTC">BTC</option>
          <option value="ETH">ETH</option>
        </select>

        <label className="mt-4 block text-sm text-white/80">Address</label>
        <input
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none"
          placeholder="Wallet address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={loading}
        />

        <label className="mt-4 block text-sm text-white/80">Amount</label>
        <input
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-white outline-none"
          type="number"
          inputMode="numeric"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          disabled={loading}
        />

        <button
          className="mt-5 w-full rounded-xl bg-white px-4 py-3 font-semibold text-black disabled:opacity-50"
          onClick={handleCashout}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Request Cashout"}
        </button>

        {msg ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white/90">
            {msg}
          </div>
        ) : null}
      </div>
    </main>
  );
}
