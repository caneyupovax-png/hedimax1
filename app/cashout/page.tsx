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

    try {
      // 🔐 Kullanıcı var mı
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes?.user) {
        setMsg("Giriş yapman gerekiyor");
        return;
      }

      // 🔑 Session + token
      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes?.session?.access_token;

      if (!token) {
        setMsg("Oturum bulunamadı, tekrar giriş yap");
        return;
      }

      // 🚀 API çağrısı (coin LOWERCASE → invalid coin fix)
      const res = await fetch("/api/cashout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          coin: coin.toLowerCase(), // ✅ EN ÖNEMLİ FIX
          address: address.trim(),
          amount: Number(amount),
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(json?.error || "Çekim başarısız");
        return;
      }

      setMsg("Çekim talebi alındı ✅");
      setAddress("");
      setAmount(0);
    } catch {
      setMsg("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto" }}>
      <h1>Cashout</h1>

      <label>Coin</label>
      <select
        value={coin}
        onChange={(e) => setCoin(e.target.value)}
      >
        <option value="USDT">USDT</option>
        <option value="BTC">BTC</option>
        <option value="ETH">ETH</option>
      </select>

      <br /><br />

      <label>Adres</label>
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Wallet address"
      />

      <br /><br />

      <label>Miktar</label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
      />

      <br /><br />

      <button onClick={handleCashout} disabled={loading}>
        {loading ? "Gönderiliyor..." : "Çekim Yap"}
      </button>

      {msg && (
        <p style={{ marginTop: 12 }}>
          {msg}
        </p>
      )}
    </div>
  );
}
