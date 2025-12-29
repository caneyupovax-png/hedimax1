"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Offer = {
  title: string;
  subtitle: string;
  payout: string;
  img: string;
};

export default function HomePage() {
  const supabase = createClient();

  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<"success" | "error" | null>(null);

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

      const { data, error } = await supabase.auth.signUp({
        email: e,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });

      if (error) {
        showNotice("error", error.message);
        return;
      }

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
    <div className="relative -mx-6 -mt-8 px-6 pt-6">
      {/* BACKGROUND (tam ekran) */}
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
            "radial-gradient(900px 420px at 50% 18%, rgba(0,0,0,0.35), transparent 60%)," +
            "linear-gradient(to bottom, rgba(7,10,24,0.15), rgba(7,10,24,0.70), rgba(4,4,15,0.98))",
        }}
      />

      {/* CONTENT */}
      <div className="relative z-10">
        {/* HERO */}
        <div className="mx-auto max-w-6xl pt-8 pb-10">
          <div className="text-center">
            <h1 className="text-[34px] sm:text-5xl lg:text-[56px] font-extrabold leading-tight">
              <span className="text-emerald-300">Get paid</span> for testing apps,
              <br className="hidden sm:block" /> games & surveys
            </h1>
          </div>

          {/* GRID */}
          <div className="mt-10 grid gap-6 lg:grid-cols-12 items-start">
            {/* OFFERS */}
            <div className="lg:col-span-7">
              <div className="grid gap-4 sm:grid-cols-3">
                {offers.map((o) => (
                  <div key={o.title} className="card-glass p-4">
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black/30 border border-white/10">
                      <Image src={o.img} alt={o.title} fill className="object-cover" />
                    </div>

                    <div className="mt-3">
                      <div className="text-white font-semibold">{o.title}</div>
                      <div className="text-white/60 text-sm">{o.subtitle}</div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-lg font-extrabold text-white">{o.payout}</div>
                      <div className="text-xs text-white/60">★ 5.0</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 card-glass p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-white font-semibold">Hedimax rate</div>
                  <div className="text-white/75 text-sm">
                    1 USD = <span className="text-white font-semibold">1000 coin</span>
                  </div>
                </div>
                <div className="mt-2 text-white/60 text-sm">
                  Coins are credited automatically after completion via postback.
                </div>
              </div>
            </div>

            {/* SIGNUP CARD */}
            <div className="lg:col-span-5">
              <div className="card-glass p-5">
                <div className="text-center text-xl font-extrabold text-white">
                  Sign Up for Free
                </div>

                <div className="mt-4 space-y-3">
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
                    disabled={busy}
                    className="btn-primary w-full disabled:opacity-60"
                  >
                    {busy ? "Creating..." : "Create account"}
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
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HOW IT WORKS */}
        <section className="mx-auto max-w-6xl pb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              We Got Everything You Need To{" "}
              <span className="text-emerald-300">Start Earning</span>.
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="card-glass p-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 ring-2 ring-emerald-400/30">
                <span className="text-3xl">🎮</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Play the Game / Survey</h3>
              <p className="text-sm text-white/65">
                Choose from a variety of games, surveys and tasks curated from trusted partners.
              </p>
            </div>

            <div className="card-glass p-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 ring-2 ring-emerald-400/30">
                <span className="text-3xl">👑</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Complete the Offer</h3>
              <p className="text-sm text-white/65">
                Most offers are quick and straightforward, usually taking only a few minutes.
              </p>
            </div>

            <div className="card-glass p-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 ring-2 ring-emerald-400/30">
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
