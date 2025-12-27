"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Eğer login olmuşsa dashboard'a at
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      if (data?.session) router.replace("/dashboard");
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setOk(null);

    if (password.length < 6) {
      setMsg("Password must be at least 6 characters.");
      return;
    }
    if (password !== password2) {
      setMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        // Email confirmation açıksa Supabase mail atar.
        // Kapalıysa direkt session dönebilir.
        options: {
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/dashboard`
              : undefined,
        },
      });

      if (error) {
        setMsg(error.message);
        setLoading(false);
        return;
      }

      // Eğer confirmation açıksa user oluşturulur ama session gelmeyebilir:
      if (!data.session) {
        setOk("Account created. Please check your email to confirm your account.");
        setLoading(false);
        return;
      }

      // Confirmation kapalıysa direkt giriş yapar:
      router.replace("/dashboard");
      router.refresh();
    } catch (err: any) {
      setMsg(err?.message ?? "Register failed.");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-950 to-black text-white">
      {/* soft blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-[520px] w-[520px] rounded-full bg-emerald-400/10 blur-3xl" />

      {/* background dim/blur */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      {/* Modal */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="relative w-full max-w-[520px] rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {/* Close */}
          <button
            onClick={() => router.push("/")}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/20 text-white/80 hover:bg-black/30 hover:text-white transition"
          >
            ✕
          </button>

          {/* Brand */}
          <div className="mb-8 flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5">
              <Image src="/logo.png" alt="Hedimax" fill className="object-contain p-1" priority />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-semibold tracking-tight">Hedimax</div>
              <div className="text-xs text-white/60">Create your account</div>
            </div>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight">Register</h1>
          <p className="mt-2 text-sm text-white/70">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-300 hover:text-emerald-200">
              Sign in
            </Link>
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm text-white/80">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className="h-12 w-full rounded-xl border border-white/15 bg-white/10 px-4 text-white placeholder:text-white/40 outline-none transition focus:border-emerald-400/50 focus:bg-white/12"
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm text-white/80">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-white/15 bg-white/10 px-4 text-white placeholder:text-white/40 outline-none transition focus:border-emerald-400/50 focus:bg-white/12"
                autoComplete="new-password"
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm text-white/80">Confirm password</label>
              <input
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="h-12 w-full rounded-xl border border-white/15 bg-white/10 px-4 text-white placeholder:text-white/40 outline-none transition focus:border-emerald-400/50 focus:bg-white/12"
                autoComplete="new-password"
                required
              />
            </div>

            {/* OK / Error */}
            {ok && (
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {ok}
              </div>
            )}
            {msg && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {msg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-emerald-400 text-black font-semibold shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create account"}
            </button>

            <p className="text-center text-xs text-white/45">
              By creating an account you agree to our{" "}
              <Link href="/terms" className="text-white/70 hover:text-white">
                Terms
              </Link>{" "}
              &{" "}
              <Link href="/privacy" className="text-white/70 hover:text-white">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
