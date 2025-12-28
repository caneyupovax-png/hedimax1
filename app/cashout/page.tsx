"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

type Coin = "BTC" | "ETH" | "USDT";

export default function CashoutPage() {
  // 🔴 Bu log GELMİYORSA → yanlış dosya deploy ediliyor
  console.log("CASHOUT PAGE LOADED – VERSION v1");

  const supabase = createClient();

  const [coin, setCoin] = useState<Coin>("BTC");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCashout() {
    setMsg("");
    setLoading(true);

    try {
      // 1️⃣ USER VAR MI
      const { data: userData, error: userErr } =
        await supabase.auth.getUser();

      console.log("USER:", userData?.user?.id || "NO USER");

      if (userErr || !userData?.user) {
        setMsg("Not logged in");
        return;
      }

      // 2️⃣ SESSION + TOKEN
      const { data: sessionData } =
        await supabase.auth.getSession();

      const token = sessionData?.session?.access_token;

      console.log("TOKEN LEN:", token?.length || 0);

      if (!token) {
        setMsg("TOKEN YOK (session null)");
        return;
      }

      // 3️⃣ HEADER'I ZORLA VE LOGLA
      const headers = new Headers();
      headers.set("Content-Type", "application/json");
      headers.set("Authorization", `Bearer ${token}`);

      console.log(
        "SENDING HEADERS:",
        Array.from(headers.entries())
      );

      // 4️⃣ API CALL
      const res = await fetch("/api/cashout", {
        method: "POST",
        headers,
        body: JSON.stringify({
          coin,
          address,
          amount,
        }),
      });

      const json = await res.json().catch(() => ({}));

      console.log("API STATUS:", res.status);
      console.log("API RESPONSE:", json);

      if (!res.ok) {
        setMsg(json?.error || "Cashout failed");
        return;
      }

      setMsg("Cashout success ✅");
      setAddress("");
      setAmount(0);
    } catch (err: any) {
      console.error("CASHOUT ERROR:", err);
      setMsg("Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 480 }}>
      <h1>Cashout</h1>

      <label>Coin</label>
      <select
        value={coin}
        onChange={(e) => setCoin(e.target.value as Coin)}
      >
        <option value="BTC">BTC</option>
        <option value="ETH">ETH</option>
        <option value="USDT">USDT</option>
      </select>

      <br /><br />

      <label>Address</label>
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Wallet address"
      />

      <br /><br />

      <label>Amount</label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

      <br /><br />

      <button onClick={handleCashout} disabled={loading}>
        {loading ? "Sending..." : "Cashout"}
      </button>

      {msg && (
        <p style={{ marginTop: 12 }}>
          {msg}
        </p>
      )}
    </main>
  );
}
