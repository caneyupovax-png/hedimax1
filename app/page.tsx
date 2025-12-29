"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Offer = {
  title: string;
  subtitle: string;
  payout: string;
  img: string;
};

export default function HomePage() {
  const supabase = createClient();

  const [isAuthed, setIsAuthed] = useState(false);

  // Signup UI state
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<"success" | "error" | null>(null);

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

  const offers: Offer[] = useMemo(
    () => [
      {
        title: "Netflix",
        subtitle: "Start a trial month",
        payout: "$5.00",
        img: "/offers/netflix.png",
      },
      {
        title: "Dice Dreams",
        subtitle: "Reach level 10",
        payout: "$414.00",
        img: "/offers/game.png",
      },
      {
        title: "TikTok",
        subtitle: "Sign up",
        payout: "$2.00",
        img: "/offers/tiktok.png",
      },
    ],
    []
  );

  const showNotice = (type: "success" | "error", text: string) => {
    setNoticeType(type);
    setNotice(text);
  };

  const signup = async () => {
    setNotice(null);
    setNoticeType(null);

    if (isAuthed) return;

    const e = email.trim();
    if (!e.includes("@") || e.length < 5) {
      showNotice("error", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      showNotice("error", "Password must be at least 6 characters.");
      return;
    }

    try {
      setBusy(true);

      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/dashboard`
          : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: e,
        password,
        options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
      });

      if (error) {
        showNotice("error", error.message);
        return;
      }

      // Email confirmation kapalıysa direkt session gelir
      if (data.session) {
        showNotice("success", "Account created. Redirecting…");
        window.location.href = "/dashboard";
        return;
      }

      showNotice(
        "success",
        "Account created. Confirmation email sent. Please check your inbox (and spam)."
      );

      setPassword("");
      setShowPass(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative -mx-6 -mt-8 px-6 pt-8">
      {/* Background image + overlay */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/hero-bg.jpg"
          alt="Background"
          fill
          priority
          className="object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#070A18]/30 via-[#070A18]/85 to-[#04040f]" />
      </div>

      {/* Landing top bar (navbar / is hidden on /) */}
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            {/* BIGGER LOGO */}
            <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Image
                src="/logo.png"
                alt="Hedimax"
                fill
                className="object-contain p-2"
                priority
              />
            </div>

            {/* BIGGER BRAND */}
            <div className="leading-tight">
              <div className="text-2xl font-extrabold tracking-wide">
                <span className="text-emerald-300">HEDI</span>MAX
              </div>
              <div className="text-sm text-white/60">
                Earn rewards • Cash out fast
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAuthed ? (
              <>
                <Link className="btn-ghost" href="/login">
                  Sign In
                </Link>
                <Link className="btn-primary" href="/register">
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* HERO */}
      <div className="mx-auto max-w-6xl pt-8 pb-10">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
            <span className="text-emerald-300">Get paid</span> for testing apps,
            <br className="hidden sm:block" /> games & surveys
          </h1>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-white/70">
            <div className="pill">Earn up to $414 per offer</div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              <span>Offers available now</span>
            </div>
          </div>
        </div>

        {/* Content row */}
        <div className="mt-10 grid gap-6 lg:grid-cols-12 items-start">
          {/* Offers */}
          <div className="lg:col-span-7">
            <div className="grid gap-4 sm:grid-cols-3">
              {offers.map((o) => (
                <div key={o.title} className="card-glass p-4">
                  <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black/30 border border-white/10">
                    <Image
                      src={o.img}
                      alt={o.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="mt-3">
                    <div className="text-white font-semibold">{o.title}</div>
                    <div className="text-white/60 text-sm">{o.subtitle}</div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-lg font-extrabold text-white">
                      {o.payout}
                    </div>
                    <div className="text-xs text-white/60">★ 5.0</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 card-glass p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-white font-semibold">Hedimax rate</div>
                <div className="text-white/75 text-sm">
                  1 USD ={" "}
                  <span className="text-white font-semibold">1000 coin</span>
                </div>
              </div>
              <div className="mt-2 text-white/60 text-sm">
                Coins are credited automatically after completion via postback.
              </div>
            </div>
          </div>

          {/* Signup card */}
          <div className="lg:col-span-5">
            <div className="card-glass p-6">
              <div className="text-center text-2xl font-extrabold text-white">
                Sign Up for Free
              </div>

              <div className="mt-5 space-y-3">
                <input
                  className="input"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setShowPass(true)}
                  inputMode="email"
                  autoComplete="email"
                />

                {showPass ? (
                  <input
                    className="input"
                    placeholder="Password (min 6 chars)"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                ) : null}

                <button
                  type="button"
                  onClick={signup}
                  disabled={busy || isAuthed}
                  className="btn-primary w-full inline-flex items-center justify-center disabled:opacity-60"
                >
                  {isAuthed
                    ? "You're already signed in"
                    : busy
                    ? "Creating..."
                    : "Create account"}
                </button>

                {notice ? (
                  <div
                    className={[
                      "rounded-2xl border px-3 py-2 text-xs leading-relaxed",
                      noticeType === "success"
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                        : "border-red-400/30 bg-red-400/10 text-red-100",
                    ].join(" ")}
                  >
                    {notice}
                  </div>
                ) : null}

                {!isAuthed ? (
                  <div className="text-center text-xs text-white/55">
                    Already have an account?{" "}
                    <Link
                      className="text-white underline underline-offset-4"
                      href="/login"
                    >
                      Sign in
                    </Link>
                  </div>
                ) : (
                  <div className="text-center text-xs text-white/55">
                    Go to{" "}
                    <Link
                      className="text-white underline underline-offset-4"
                      href="/dashboard"
                    >
                      Dashboard
                    </Link>
                    .
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="card-glass p-4">
                <div className="text-sm font-semibold">Fast cashout</div>
                <div className="mt-1 text-sm text-white/65">
                  Withdraw securely when you reach minimum.
                </div>
              </div>
              <div className="card-glass p-4">
                <div className="text-sm font-semibold">Fraud protection</div>
                <div className="mt-1 text-sm text-white/65">
                  We verify completions to keep rewards fair.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-6" />
    </div>
  );
}
