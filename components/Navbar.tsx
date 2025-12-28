"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Navbar() {
  const pathname = usePathname();

  // 🔴 Anasayfada navbar yok
  if (pathname === "/") return null;

  const supabase = createClient();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;

    // İlk session kontrolü
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setIsAuthed(!!data.session);
    });

    // Auth değişimlerini dinle
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setIsAuthed(!!session);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      window.location.href = "/"; // landing'e at
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="nav-glass">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        {/* LOGO */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/10" />
          <span className="text-white font-semibold tracking-wide">
            Hedimax
          </span>
        </Link>

        {/* MENU */}
        <nav className="flex items-center gap-2">
          {isAuthed === null ? (
            <span className="text-white/60 text-sm">...</span>
          ) : isAuthed ? (
            <>
              <Link className="btn-ghost" href="/earn">
                Earn
              </Link>
              <Link className="btn-ghost" href="/cashout">
                Cashout
              </Link>
              <button
                onClick={logout}
                disabled={loading}
                className="btn-ghost"
              >
                {loading ? "Logging out..." : "Logout"}
              </button>
            </>
          ) : (
            <>
              <Link className="btn-ghost" href="/login">
                Sign in
              </Link>
              <Link className="btn-primary" href="/register">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
