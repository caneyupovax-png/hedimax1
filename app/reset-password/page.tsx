"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // Supabase mail linkinden gelince session oluşur.
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setMsg(
          "Open this page from the reset link in your email. (No active session found.)"
        );
      }
    })();
  }, []);

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setMsg("No session. Please open the reset link from your email again.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) setMsg(error.message);
    else setMsg("✅ Password updated. You can sign in now.");

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#070a0f] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="mt-2 text-sm text-white/60">
          Choose a new password.
        </p>

        <form onSubmit={updatePassword} className="mt-6 space-y-3">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="New password"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none"
            minLength={6}
            required
          />

          <button
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-lime-500 py-3 font-bold text-[#06110b] disabled:opacity-60"
          >
            {loading ? "Saving..." : "Update password"}
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
