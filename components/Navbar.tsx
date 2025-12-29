"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

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
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!alive) return;

      if (!user) {
        setIsAuthed(false);
        setUsername("User");
        setBalance(0);
        setLoading(false);
        return;
      }

      setIsAuthed(true);

      const name =
        (user.user_metadata as any)?.username ||
        (user.user_metadata as any)?.name ||
        (user.email ? user.email.split("@")[0] : "User");

      setUsername(String(name));

      const { data: pb } = await supabase
        .from("points_balance")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      setBalance(Number(pb?.balance ?? 0));
      setLoading(false);
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    // ✅ after sign out, go home
    router.push("/");
    router.refresh();
  };

  const navItem = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link href={href} className={active ? "btn-primary" : "btn-ghost"}>
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
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Hedimax" width={34} height={34} />
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
                {/* Coins - same height/style as buttons */}
                <Link
                  href="/cashout"
                  className="hidden sm:inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-extrabold text-white hover:border-emerald-400/25 hover:bg-white/7 transition"
                  title="Go to cashout"
                >
                  <span className="text-white/60 font-semibold">Coins</span>
                  <span className="text-white">{balance}</span>
                </Link>

                {/* User - one line, clean */}
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:border-emerald-400/25 hover:bg-white/7 transition"
                  title="Dashboard"
                >
                  <span className="text-white/60">User</span>
                  <span className="text-white font-extrabold">{username}</span>
                </Link>

                {/* Sign out - ghost style */}
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
