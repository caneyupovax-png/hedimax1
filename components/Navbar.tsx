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

  useEffect(() => {
    let alive = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setIsAuthed(!!data.session);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!alive) return;
      setIsAuthed(!!session);
      setLoading(false);
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
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
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
            isOn ? "w-full bg-emerald-400" : "group-hover:w-full bg-emerald-400/70",
          ].join(" ")}
        />
      </Link>
    );
  };

  const PrimaryBtn =
    "inline-flex h-11 items-center justify-center rounded-full px-7 text-sm font-semibold leading-none transition";
  const GhostBtn =
    "inline-flex h-11 items-center justify-center rounded-full px-7 text-sm font-semibold leading-none transition";

  return (
    <header className="sticky top-0 z-50">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-emerald-500/8 to-transparent" />

      <div className="border-b border-black/60 bg-gradient-to-b from-black/95 via-black/90 to-black/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          {/* LEFT */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_0_0_1px_rgba(16,185,129,0.12)]">
              <Image
                src="/logo.png"
                alt="Hedimax"
                fill
                className="object-contain p-2"
                priority
              />
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">
              HEDIMAX
            </span>
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
              <div className="flex items-center gap-3">
                <div className="h-11 w-28 animate-pulse rounded-full bg-white/10" />
                <div className="h-11 w-32 animate-pulse rounded-full bg-white/10" />
              </div>
            ) : isAuthed ? (
              <button
                onClick={onLogout}
                className={`${PrimaryBtn} bg-emerald-400 text-black hover:bg-emerald-300`}
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`${PrimaryBtn} bg-emerald-400 text-black hover:bg-emerald-300`}
                >
                  Sign In
                </Link>

                <Link
                  href="/register"
                  className={`${GhostBtn} border border-emerald-400/55 bg-black text-emerald-200 hover:bg-black/80 hover:border-emerald-300/80`}
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
