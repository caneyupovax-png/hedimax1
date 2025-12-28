"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("Guest");
  const [balance, setBalance] = useState<number>(0);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      const session = data.session;
      setIsAuthed(!!session);

      if (session?.user) {
        const u: any = session.user;
        const name =
          u?.user_metadata?.username ||
          u?.user_metadata?.name ||
          (u?.email ? u.email.split("@")[0] : "User");

        setUsername(name);

        const { data: pb } = await supabase
          .from("points_balance")
          .select("balance")
          .eq("user_id", u.id)
          .single();

        setBalance(Number(pb?.balance ?? 0));
      } else {
        setUsername("Guest");
        setBalance(0);
      }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
    setLoading(false);
  };

  const active = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  const NavItem = ({ href, label }: { href: string; label: string }) => {
    const isOn = active(href);
    return (
      <Link
        href={href}
        className={[
          "group relative px-2 py-2 text-[12px] font-semibold uppercase tracking-[0.22em] transition",
          isOn ? "text-white" : "text-white/70 hover:text-white",
        ].join(" ")}
      >
        {label}
        <span
          className={[
            "pointer-events-none absolute left-0 right-0 -bottom-[8px] mx-auto h-[2px] w-0 rounded-full transition-all duration-300",
            isOn
              ? "w-full bg-emerald-400"
              : "group-hover:w-full bg-emerald-400/70",
          ].join(" ")}
        />
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50">
      {/* 🔥 SAYDAMLIK AZALTILDI */}
      <div className="border-b border-white/10 bg-black/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          {/* LEFT */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-2xl border border-white/10 bg-black">
              <Image
                src="/logo.png"
                alt="Hedimax"
                fill
                className="object-contain p-2"
                priority
              />
            </div>
            <span className="text-sm font-semibold text-white">HEDIMAX</span>
          </Link>

          {/* CENTER */}
          <nav className="hidden items-center gap-8 md:flex">
            <NavItem href="/earn" label="Earn" />
            <NavItem href="/cashout" label="Cashout" />
            <NavItem href="/leaderboard" label="Leaderboard" />
            <NavItem href="/rewards" label="Rewards" />
          </nav>

          {/* RIGHT */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-11 w-40 animate-pulse rounded-full bg-white/10" />
            ) : isAuthed ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm hover:border-white/20"
                >
                  {username} • {balance} pts
                </Link>

                <button
                  onClick={onLogout}
                  className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-black hover:bg-emerald-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* ✅ LOGIN */}
                <Link
                  href="/login"
                  className="rounded-full bg-emerald-400 px-6 py-2 text-sm font-semibold text-black hover:bg-emerald-300"
                >
                  Login
                </Link>

                {/* ✅ REGISTER (GERİ EKLENDİ) */}
                <Link
                  href="/register"
                  className="rounded-full border border-emerald-400/55 bg-black px-6 py-2 text-sm font-semibold text-emerald-200 hover:border-emerald-300/80 hover:bg-black/80"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
