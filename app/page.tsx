"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function HomePage() {
  const supabase = createClient();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setIsAuthed(!!data.session);
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!alive) return;
      setIsAuthed(!!session);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-64px)]">
      {/* Background accents (şimdi düzgün çalışır çünkü parent relative) */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-[520px] w-[520px] rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* HERO */}
        <section className="grid items-center gap-10 lg:grid-cols-2">
          <div className="card-glass p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <Image
                  src="/logo.png"
                  alt="Hedimax"
                  fill
                  className="object-contain p-2"
                  priority
                />
              </div>
              <div className="leading-tight">
                <div className="text-xl font-semibold tracking-tight">Hedimax</div>
                <div className="text-sm text-white/60">Earn rewards. Cash out fast.</div>
              </div>
            </div>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Earn from offerwalls,
              <span className="text-emerald-300"> cashout</span> in minutes.
            </h1>

            <p className="mt-4 max-w-xl text-base text-white/70">
              Complete offers, surveys and tasks. Track your coins and withdraw quickly.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/earn" className="btn-primary">
                Start Earning
              </Link>

              {!isAuthed ? (
                <>
                  <Link href="/login" className="btn-ghost">Sign in</Link>
                  <Link href="/register" className="btn-ghost">Register</Link>
                </>
              ) : (
                <Link href="/dashboard" className="btn-ghost">
                  Go to Dashboard
                </Link>
              )}
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <div className="card-glass p-4">
                <div className="text-sm font-semibold">Rate</div>
                <div className="mt-1 text-sm text-white/65">
                  1 USD = <span className="text-white font-semibold">1000 coin</span>
                </div>
              </div>
              <div className="card-glass p-4">
                <div className="text-sm font-semibold">Auto credit</div>
                <div className="mt-1 text-sm text-white/65">
                  Coins are added after completion via postback.
                </div>
              </div>
            </div>

            {/* Trust links (doğru route) */}
            <div className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/60">
              <Link className="hover:text-white" href="/legal/terms">Terms</Link>
              <Link className="hover:text-white" href="/legal/privacy">Privacy</Link>
              <Link className="hover:text-white" href="/legal/cookies">Cookies</Link>
              <Link className="hover:text-white" href="/legal/contact">Contact</Link>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-emerald-500/10 blur-2xl" />
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src="/hero.png"
                  alt="Hedimax hero"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="card-glass p-5">
              <div className="text-sm font-semibold text-emerald-200">1</div>
              <div className="mt-2 text-base font-semibold">Create an account</div>
              <div className="mt-1 text-sm text-white/65">Register and access your dashboard.</div>
            </div>
            <div className="card-glass p-5">
              <div className="text-sm font-semibold text-emerald-200">2</div>
              <div className="mt-2 text-base font-semibold">Complete offers</div>
              <div className="mt-1 text-sm text-white/65">Go to Earn and complete tasks & surveys.</div>
            </div>
            <div className="card-glass p-5">
              <div className="text-sm font-semibold text-emerald-200">3</div>
              <div className="mt-2 text-base font-semibold">Cashout</div>
              <div className="mt-1 text-sm text-white/65">Withdraw securely when you reach the minimum.</div>
            </div>
          </div>
        </section>

        {/* ❌ Footer yok: çünkü global layout footer zaten var */}
      </div>
    </div>
  );
}
