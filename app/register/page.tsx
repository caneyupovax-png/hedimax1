"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    if (username.trim().length < 3) {
      setMsg("Username must be at least 3 characters.");
      setLoading(false);
      return;
    }

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(), // 👈 KULLANICI ADI BURAYA KAYDEDİLİR
        },
        emailRedirectTo: `${origin}/login`,
      },
    });

    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    setMsg(
      "✅ Account created. Please check your email to confirm your account."
    );
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#070a0f] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Create your Hedimax account</h1>
          <p className="mt-2 text-sm text-white/60">
            Sign up and start earning rewards.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-emerald-400"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-emerald-400"
          />

          <input
            type="password"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-emerald-400"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 py-3 font-bold text-[#06110b] hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        {msg ? (
          <div className="mt-4 text-sm text-white/80 whitespace-pre-wrap">
            {msg}
          </div>
        ) : null}

        {/* Links */}
        <div className="mt-6 text-center text-sm text-white/60">
          Already have an account?{" "}
          <Link href="/login" className="hover:text-white">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
