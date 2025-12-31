"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

type Coin = "LTC" | "BTC" | "DOGE";
const LOGO_SRC = "/logo.png";

const MIN_WITHDRAW: Record<Coin, number> = {
  LTC: 500,
  DOGE: 5000,
  BTC: 10000,
};

function CoinIcon({ coin }: { coin: Coin }) {
  const common =
    "h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center ring-1 ring-white/10";
  if (coin === "BTC") {
    return (
      <div className={common} aria-label="Bitcoin">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path d="M9 6h6.2a2.8 2.8 0 0 1 0 5.6H9V6Z" stroke="currentColor" strokeWidth="1.7" opacity="0.9" />
          <path d="M9 11.6h6.8a3 3 0 0 1 0 6H9v-6Z" stroke="currentColor" strokeWidth="1.7" opacity="0.9" />
          <path d="M11 4v16" stroke="currentColor" strokeWidth="1.7" opacity="0.7" />
          <path d="M13 4v16" stroke="currentColor" strokeWidth="1.7" opacity="0.7" />
        </svg>
      </div>
    );
  }
  if (coin === "LTC") {
    return (
      <div className={common} aria-label="Litecoin">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path
            d="M10 5.5 7.8 15.2h3.8l-.6 3.3H6.5l.5-2.6-1.7.7.5-2.2 1.7-.7L9 5.5h1Z"
            fill="currentColor"
            opacity="0.9"
          />
          <path d="M12.5 10.2h3.6l-.4 2.1h-3.7" stroke="currentColor" strokeWidth="1.6" opacity="0.65" />
        </svg>
      </div>
    );
  }
  return (
    <div className={common} aria-label="Dogecoin">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path d="M8 6h5a5 5 0 0 1 0 10H8V6Z" stroke="currentColor" strokeWidth="1.8" opacity="0.9" />
        <path d="M6.5 12h7" stroke="currentColor" strokeWidth="1.8" opacity="0.7" />
      </svg>
    </div>
  );
}

function toNumber(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

export default function CashoutPage() {
  const supabase = createClient();

  const [coin, setCoin] = useState<Coin>("LTC");
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [coinsBalance, setCoinsBalance] = useState<number | null>(null);

  const coins = useMemo(
    () => [
      { key: "LTC" as const, label: "LTC", sub: "Litecoin" },
      { key: "DOGE" as const, label: "DOGE", sub: "Dogecoin" },
      { key: "BTC" as const, label: "BTC", sub: "Bitcoin" },
    ],
    []
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setCoinsBalance(null);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        if (!cancelled) setCoinsBalance(0);
        return;
      }

      const r1 = await supabase
        .from("points_balance")
        .select("balance")
        .eq("id", user.id)
        .maybeSingle();

      const v1 = toNumber((r1.data as any)?.balance);
      if (!r1.error && v1 !== null) {
        if (!cancelled) setCoinsBalance(Math.floor(v1));
        return;
      }

      const r2 = await supabase
        .from("points_balance")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      const v2 = toNumber((r2.data as any)?.balance);
      if (!r2.error && v2 !== null) {
        if (!cancelled) setCoinsBalance(Math.floor(v2));
        return;
      }

      if (!cancelled) setCoinsBalance(0);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleCashout() {
    setMsg("");

    const addr = address.trim();
    if (!addr) return setMsg("Wallet address required");

    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return setMsg("Enter a valid amount");

    const min = MIN_WITHDRAW[coin];
    if (n < min) return setMsg(`Minimum withdraw for ${coin} is ${min} coins`);

    if (coinsBalance !== null && n > coinsBalance) return setMsg("Insufficient balance");

    setLoading(true);

    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

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
      body: JSON.stringify({ coin, address: addr, amount: n }),
    });

    const json = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      setMsg(json?.error || "Cashout failed");
      setLoading(false);
      return;
    }

    setMsg("Cashout request sent ✅");
    setAddress("");
    setAmount("");
    setLoading(false);
  }

  const minText = MIN_WITHDRAW[coin];

  return (
    <div className="min-h-screen w-full text-white relative overflow-hidden bg-[#070A12]">
      {/* Full-page background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_18%_12%,rgba(130,160,255,0.16),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_88%_30%,rgba(255,255,255,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_110%,rgba(120,255,220,0.07),transparent_65%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/75" />
      </div>

      {/* ✅ FULL WIDTH WRAPPER (max-w yok) */}
      <div className="relative w-full px-6 lg:px-10 py-10">
        {/* Header row */}
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Cashout</h1>
            <p className="mt-1 text-sm text-white/60">Withdraw your earnings to crypto.</p>
          </div>

          <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/[0.03] px-3 py-2 backdrop-blur-xl ring-1 ring-white/10">
            <span className="text-xs text-white/55">Balance</span>
            <span className="text-sm font-semibold">{coinsBalance === null ? "…" : coinsBalance}</span>
          </div>
        </div>

        {/* ✅ CONTENT = full width, no “boxed frame” border */}
        <div className="w-full">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-stretch">
            {/* LEFT (no hard border, just soft glass) */}
            <section className="rounded-3xl bg-white/[0.02] backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.35)] p-6 lg:p-7">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold">Crypto</div>
                <div className="text-xs text-white/50">Select coin</div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3 mb-6">
                {coins.map((c) => {
                  const active = coin === c.key;
                  return (
                    <button
                      key={c.key}
                      onClick={() => setCoin(c.key)}
                      type="button"
                      className={[
                        "rounded-2xl p-4 text-left transition",
                        "focus:outline-none focus:ring-0 focus-visible:outline-none",
                        "bg-white/[0.02] ring-1 ring-white/10",
                        active ? "ring-white/25 bg-white/[0.06]" : "hover:ring-white/20 hover:bg-white/[0.05]",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <CoinIcon coin={c.key} />
                        <div>
                          <div className="font-semibold leading-tight">{c.label}</div>
                          <div className="text-xs text-white/60">{c.sub}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-semibold text-white/75">Crypto Address</div>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Wallet address"
                    className="mt-2 w-full rounded-2xl bg-white/[0.02] ring-1 ring-white/10 px-4 py-3 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none placeholder:text-white/35 text-sm"
                  />
                </div>

                <div>
                  <div className="text-sm font-semibold text-white/75">Amount</div>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount"
                    type="number"
                    inputMode="decimal"
                    className="mt-2 w-full rounded-2xl bg-white/[0.02] ring-1 ring-white/10 px-4 py-3 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none placeholder:text-white/35 text-sm"
                  />
                  <div className="mt-2 text-xs text-white/50">
                    Minimum for <span className="text-white/75 font-semibold">{coin}</span>:{" "}
                    <span className="text-white/75 font-semibold">{minText}</span> coins
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-white/55">
                Balance:{" "}
                <span className="text-white/80 font-semibold">
                  {coinsBalance === null ? "Loading…" : coinsBalance}
                </span>{" "}
                coins
              </div>

              <button
                onClick={handleCashout}
                disabled={loading}
                className="mt-6 w-full rounded-2xl bg-white text-black py-3 font-semibold disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-0 focus-visible:outline-none"
                type="button"
              >
                {loading ? "Sending..." : "Withdraw"}
              </button>

              {msg && (
                <div className="mt-4 rounded-2xl bg-white/[0.02] ring-1 ring-white/10 px-4 py-3 text-sm text-white/80">
                  {msg}
                </div>
              )}
            </section>

            {/* RIGHT (same surface style, aligned full width) */}
            <section className="relative rounded-3xl bg-white/[0.02] backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.35)] p-6 lg:p-7 overflow-hidden">
              {/* Background glow + logo (colors visible) */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_75%_0%,rgba(255,255,255,0.08),transparent_60%)]" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-black/35" />

                <div className="absolute -right-10 -top-10 h-[120%] w-[120%] opacity-35">
                  <Image
                    src={LOGO_SRC}
                    alt="Logo glow"
                    fill
                    className="object-contain blur-2xl saturate-150"
                    priority
                  />
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-85">
                  <div className="relative h-52 w-52">
                    <Image
                      src={LOGO_SRC}
                      alt="Logo"
                      fill
                      className="object-contain drop-shadow-[0_0_25px_rgba(0,0,0,0.45)]"
                      priority
                    />
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/60">Available Coins</div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] px-3 py-1 text-xs text-white/80 backdrop-blur-xl ring-1 ring-white/10">
                    <span className="opacity-70">Selected</span>
                    <span className="font-semibold">{coin}</span>
                  </div>
                </div>

                <div className="mt-2 text-4xl font-black tracking-tight">
                  {coinsBalance === null ? "—" : coinsBalance}
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm text-white/60">
                  <CoinIcon coin={coin} />
                  <div>
                    <div>
                      Minimum: <span className="text-white/75 font-semibold">{minText}</span> coins
                    </div>
                    <div className="text-xs text-white/45">
                      Source: <span className="text-white/70">points_balance.balance</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-sm text-white/60 rounded-2xl p-3 bg-white/[0.02] ring-1 ring-white/10">
                  Make sure your wallet address is correct. Withdrawals are processed automatically.
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Mobile balance */}
        <div className="sm:hidden mt-5 flex items-center justify-between rounded-2xl bg-white/[0.02] px-4 py-3 backdrop-blur-xl ring-1 ring-white/10">
          <div className="text-xs text-white/55">Balance</div>
          <div className="text-sm font-semibold">{coinsBalance === null ? "…" : coinsBalance}</div>
        </div>
      </div>
    </div>
  );
}
