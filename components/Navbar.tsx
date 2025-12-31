"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function formatCoins(v: number) {
  try {
    return new Intl.NumberFormat("en-US").format(v);
  } catch {
    return String(v);
  }
}

function toNumber(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

export default function Navbar({
  onOpenLogin,
  onOpenRegister,
}: {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [username, setUsername] = useState("User");

  // ✅ coins shown everywhere
  const [balance, setBalance] = useState<number | null>(null);

  // ✅ mini animation
  const [coinPulse, setCoinPulse] = useState(false);
  const prevBalanceRef = useRef<number | null>(null);

  // ✅ read cached coins immediately (instant UI)
  useEffect(() => {
    const v = localStorage.getItem("hedimax_balance");
    const n = v != null ? Number(v) : null;
    if (n != null && Number.isFinite(n)) {
      setBalance(n);
      prevBalanceRef.current = n;
    }
  }, []);

  const triggerPulseIfChanged = (next: number | null) => {
    const prev = prevBalanceRef.current;
    // pulse only if we had a prev value already
    if (prev !== null && next !== null && prev !== next) {
      setCoinPulse(true);
      window.setTimeout(() => setCoinPulse(false), 600);
    }
    prevBalanceRef.current = next;
  };

  const fetchBalanceInBackground = async (userId: string) => {
    // run in idle time so route transitions feel instant
    const run = async () => {
      // try schema 1: id = user.id
      const r1 = await supabase
        .from("points_balance")
        .select("balance")
        .eq("id", userId)
        .maybeSingle();

      const v1 = toNumber((r1.data as any)?.balance);
      if (!r1.error && v1 !== null) {
        const next = Math.floor(v1);
        setBalance(next);
        localStorage.setItem("hedimax_balance", String(next));
        triggerPulseIfChanged(next);
        return;
      }

      // try schema 2: user_id = user.id
      const r2 = await supabase
        .from("points_balance")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      const v2 = toNumber((r2.data as any)?.balance);
      const next = !r2.error && v2 !== null ? Math.floor(v2) : 0;

      setBalance(next);
      localStorage.setItem("hedimax_balance", String(next));
      triggerPulseIfChanged(next);
    };

    // Prefer idle callback if available
    if (typeof (window as any).requestIdleCallback === "function") {
      (window as any).requestIdleCallback(run, { timeout: 1200 });
    } else {
      // fallback
      setTimeout(run, 0);
    }
  };

  const loadAuth = async () => {
    // ✅ fast auth read
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;

    if (!user) {
      setIsAuthed(false);
      setUsername("User");
      setBalance(null);
      localStorage.removeItem("hedimax_balance");
      prevBalanceRef.current = null;
      setLoading(false);
      return;
    }

    setIsAuthed(true);

    const name =
      (user.user_metadata as any)?.username ||
      (user.user_metadata as any)?.name ||
      (user.email ? user.email.split("@")[0] : "User");

    setUsername(String(name));
    setLoading(false);

    // ✅ DO NOT block navbar / routing: fetch coins in background
    fetchBalanceInBackground(user.id);
  };

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setLoading(true);
      await loadAuth();
      if (!alive) return;
    };

    run();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      run();
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("hedimax_balance");
    prevBalanceRef.current = null;
    setBalance(null);
    router.push("/");
    router.refresh();
  };

  const navItem = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link href={href} prefetch className={active ? "btn-primary" : "btn-ghost"}>
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* LEFT */}
          <div className="flex items-center gap-6">
            <Link href="/" prefetch className="flex items-center gap-2">
              <Image src="/logo.png" alt="Hedimax" width={34} height={34} priority />
              <span className="text-lg font-extrabold leading-none">
                <span className="text-emerald-300">HEDI</span>MAX
              </span>
            </Link>

            {isAuthed && !loading && (
              <nav className="hidden md:flex items-center gap-2">
                {navItem("/earn", "Earn")}
                {navItem("/cashout", "Cashout")}
                {navItem("/rewards", "Rewards")}
              </nav>
            )}
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="text-white/60 text-sm px-3">...</div>
            ) : !isAuthed ? (
              <>
                <Link
                  href="/?auth=login"
                  prefetch
                  className="btn-ghost"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenLogin();
                  }}
                >
                  Sign In
                </Link>

                <Link
                  href="/?auth=register"
                  prefetch
                  className="btn-primary"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenRegister();
                  }}
                >
                  Sign Up
                </Link>
              </>
            ) : (
              <>
                {/* Coins */}
                <Link
                  href="/cashout"
                  prefetch
                  className="hidden sm:inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-white hover:border-emerald-400/25 hover:bg-white/7 transition"
                  title="Go to cashout"
                >
                  <span className="text-white/60 font-semibold">Coins</span>

                  <span
                    className={[
                      "text-white tabular-nums transition-transform duration-300",
                      coinPulse ? "animate-pulse scale-105" : "scale-100",
                    ].join(" ")}
                    aria-label="Coins balance"
                  >
                    {balance == null ? "—" : formatCoins(balance)}
                  </span>
                </Link>

                {/* User */}
                <Link
                  href="/dashboard"
                  prefetch
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:border-emerald-400/25 hover:bg-white/7 transition"
                  title="Dashboard"
                >
                  <span className="text-white/60">User</span>
                  <span className="text-white font-extrabold">{username}</span>
                </Link>

                <button className="btn-ghost" onClick={signOut}>
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
