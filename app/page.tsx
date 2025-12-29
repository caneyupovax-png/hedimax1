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

  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthed(!!data.session);
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setIsAuthed(!!session);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  const offers: Offer[] = useMemo(
    () => [
      { title: "Netflix", subtitle: "Start a trial month", payout: "$5.00", img: "/offers/netflix.png" },
      { title: "Dice Dreams", subtitle: "Reach level 10", payout: "$414.00", img: "/offers/game.png" },
      { title: "TikTok", subtitle: "Sign up", payout: "$2.00", img: "/offers/tiktok.png" },
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

    if (!email.includes("@")) {
      showNotice("error", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      showNotice("error", "Password must be at least 6 characters.");
      return;
    }

    try {
      setBusy(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        showNotice("error", error.message);
        return;
      }

      showNotice(
        "success",
        "Account created. Confirmation email sent. Please check your inbox."
      );

      setPassword("");
      setShowPass(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative -mx-6 -mt-8 px-6 pt-6">
      {/* BACKGROUND */}
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url(/hero-bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.55,
          filter: "saturate(1.05) contrast(1.02)",
        }}
      />
      <div
        className="fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(7,10,24,0.15), rgba(7,10,24,0.7), rgba(4,4,15,0.98))",
        }}
      />

      {/* CONTENT */}
      <div className="relative z-10">
        {/* TOP BAR */}
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between py-4">
            {/* LOGO */}
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Hedimax"
                width={44}
                height={44}
                priority
              />
              <span className="text-xl font-extrabold leading-none">
                <span className="text-emerald-300">HEDI</span>MAX
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!isAuthed ? (
                <>
                  <Link className="btn-ghost" href="/login">Sign In</Link>
                  <Link className="btn-primary" href="/register">Sign Up</Link>
                </>
              ) : (
                <>
                  <Link className="btn-ghost" href="/dashboard">Dashboard</Link>
                  <Link className="btn-primary" href="/earn">Earn</Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* HERO */}
        <div className="mx-auto max-w-6xl pt-6 pb-12">
          <div className="text-center">
            <h1 className="text-[34px] sm:text-5xl lg:text-[56px] font-extrabold leading-tight">
              <span className="text-emerald-300">Get paid</span> for testing apps,
              <br className="hidden sm:block" /> games & surveys
            </h1>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            {/* OFFERS */}
            <div className="lg:col-span-7 grid sm:grid-cols-3 gap-4">
              {offers.map((o) => (
                <div key={o.title} className="card-glass p-4">
                  <div className="relative aspect-square rounded-xl overflow-hidden">
                    <Image src={o.img} alt={o.title} fill className="object-cover" />
                  </div>
                  <div className="mt-2 font-semibold">{o.title}</div>
                  <div className="text-sm text-white/60">{o.subtitle}</div>
                  <div className="mt-1 font-bold">{o.payout}</div>
                </div>
              ))}
            </div>

            {/* SIGNUP */}
            <div className="lg:col-span-5">
              <div className="card-glass p-5">
                <div className="text-xl font-extrabold text-center mb-4">
                  Sign Up for Free
                </div>

                <div className="space-y-3">
                  <input
                    className="input"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setShowPass(true)}
                  />

                  {showPass && (
                    <input
                      className="input"
                      type="password"
                      placeholder="Password (min 6 chars)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  )}

                  <button
                    onClick={signup}
                    disabled={busy}
                    className="btn-primary w-full"
                  >
                    {busy ? "Creating..." : "Create account"}
                  </button>

                  {notice && (
                    <div
                      className={`text-xs rounded-xl px-3 py-2 ${
                        noticeType === "success"
                          ? "bg-emerald-400/10 text-emerald-200"
                          : "bg-red-400/10 text-red-200"
                      }`}
                    >
                      {notice}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <section className="mx-auto max-w-6xl pb-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              We Got Everything You Need To{" "}
              <span className="text-emerald-300">Start Earning</span>.
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="card-glass p-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full
                              bg-emerald-400/10 ring-2 ring-emerald-400/30">
                <span className="text-3xl">🎮</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Play the Game / Survey</h3>
              <p className="text-sm text-white/65">
                Choose from a variety of games, surveys and tasks curated from trusted partners.
              </p>
            </div>

            <div className="card-glass p-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full
                              bg-emerald-400/10 ring-2 ring-emerald-400/30">
                <span className="text-3xl">👑</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Complete the Offer</h3>
              <p className="text-sm text-white/65">
                Most offers are quick and straightforward, usually taking only a few minutes.
              </p>
            </div>

            <div className="card-glass p-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full
                              bg-emerald-400/10 ring-2 ring-emerald-400/30">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Get Paid</h3>
              <p className="text-sm text-white/65">
                Earn coins instantly. 1000 coins equals $1.00. Cash out securely anytime.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
