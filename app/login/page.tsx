"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      // ✅ LOGIN SONRASI DASHBOARD
      router.push("/dashboard");
    } catch {
      setMsg("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <form
        onSubmit={handleLogin}
        className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur"
      >
        <h1 className="mb-6 text-center text-2xl font-semibold">
          Login
        </h1>

        <label className="text-sm text-white/70">Email</label>
        <input
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/60 p-3 text-white outline-none"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="mt-4 block text-sm text-white/70">
          Password
        </label>
        <input
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/60 p-3 text-white outline-none"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-white py-3 font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        {msg && (
          <p className="mt-4 text-center text-sm text-red-400">
            {msg}
          </p>
        )}
      </form>
    </div>
  );
}
