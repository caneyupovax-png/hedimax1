"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/reset-password`,
    });

    if (error) {
      setMsg(error.message);
    } else {
      setMsg("✅ Password reset email sent. Check your inbox (and spam).");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#070a0f] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <p className="mt-2 text-sm text-white/60">
          Enter your email and we’ll send you a reset link.
        </p>

        <form onSubmit={sendReset} className="mt-6 space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
            required
          />

          <button
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 py-3 font-bold text-[#06110b] disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        {msg ? (
          <div className="mt-4 text-sm text-white/80 whitespace-pre-wrap">
            {msg}
          </div>
        ) : null}

        <div className="mt-6 text-sm text-white/60">
          <Link className="hover:text-white" href="/login">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
