"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setIsAuthed(!!data.session);
      setLoading(false);
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setIsAuthed(!!session);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAuthed(false);
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Hedimax" width={38} height={38} priority />
            <span className="text-lg font-extrabold leading-none">
              <span className="text-emerald-300">HEDI</span>MAX
            </span>
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="text-white/60 text-sm px-3">...</div>
            ) : !isAuthed ? (
              <>
                {/* ✅ JS olmasa bile aynı sayfada auth param ile açılır */}
                <Link
                  href="/?auth=login"
                  className="btn-ghost"
                  onClick={(e) => {
                    // JS varsa: route değiştirmeden modal aç (daha hızlı)
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
                <Link className="btn-ghost" href="/dashboard">
                  Dashboard
                </Link>
                <Link className="btn-primary" href="/earn">
                  Earn
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
