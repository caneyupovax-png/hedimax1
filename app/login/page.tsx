"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

function isValidEmail(v: string) {
  // basit ama iş görür
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [msg, setMsg] = useState<string>("");
  const [msgType, setMsgType] = useState<"error" | "success" | "info">("info");
  const [loading, setLoading] = useState(false);

  const emailOk = useMemo(() => isValidEmail(email), [email]);
  const pwOk = useMemo(() => password.length >= 6, [password]);

  const canSubmit = useMemo(() => {
    return emailOk && pwOk && !loading;
  }, [emailOk, pwOk, loading]);

  function setMessage(type: "error" | "success" | "info", text: string) {
    setMsgType(type);
    setMsg(text);
  }

  async function handleSubmit() {
    setMsg("");
    if (!emailOk) return setMessage("error", "Lütfen geçerli bir email gir.");
    if (!pwOk) return setMessage("error", "Şifre en az 6 karakter olmalı.");

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;

        setMessage(
          "success",
          "Kayıt başarılı. Eğer email doğrulama açıksa mailine gelen linke tıkla."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        router.push("/dashboard");
      }
    } catch (e: any) {
      setMessage("error", e?.message ?? "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && canSubmit) handleSubmit();
  }

  const msgClass =
    msgType === "error"
      ? "border-red-500/20 bg-red-500/10 text-red-100"
      : msgType === "success"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
      : "border-white/10 bg-white/5 text-zinc-200";

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 md:grid-cols-2">
        {/* Left */}
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Hedimax1 • Earn & Rewards
          </div>

          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
            Görevleri tamamla, <span className="text-emerald-300">puan</span> kazan.
          </h1>

          <p className="max-w-md text-zinc-300">
            {mode === "signin"
              ? "Giriş yapıp dashboard’a geç."
              : "Kayıt ol, hesabını oluştur ve kazanmaya başla."}
          </p>

          <div className="grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-zinc-300">Hızlı</p>
              <p className="mt-1 font-medium">Anında giriş</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-zinc-300">Güvenli</p>
              <p className="mt-1 font-medium">Supabase Auth</p>
            </div>
          </div>
        </div>

        {/* Right card */}
        <div className="w-full">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {mode === "signin" ? "Giriş Yap" : "Kayıt Ol"}
              </h2>

              <div className="flex rounded-full border border-white/10 bg-black/20 p-1 text-sm">
                <button
                  onClick={() => {
                    setMode("signin");
                    setMsg("");
                  }}
                  className={`rounded-full px-3 py-1.5 transition ${
                    mode === "signin" ? "bg-white/15 text-white" : "text-zinc-300 hover:text-white"
                  }`}
                >
                  Giriş
                </button>
                <button
                  onClick={() => {
                    setMode("signup");
                    setMsg("");
                  }}
                  className={`rounded-full px-3 py-1.5 transition ${
                    mode === "signup" ? "bg-white/15 text-white" : "text-zinc-300 hover:text-white"
                  }`}
                >
                  Kayıt
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-zinc-300">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="mail@ornek.com"
                  className={`w-full rounded-2xl border bg-black/30 px-4 py-3 text-zinc-100 outline-none placeholder:text-zinc-500 focus:outline-none ${
                    email.length === 0
                      ? "border-white/10"
                      : emailOk
                      ? "border-emerald-400/40"
                      : "border-red-400/40"
                  }`}
                />
                {email.length > 0 && !emailOk && (
                  <p className="mt-2 text-xs text-red-200/90">Email formatı doğru değil.</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm text-zinc-300">Şifre</label>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={onKeyDown}
                    type={showPw ? "text" : "password"}
                    placeholder="En az 6 karakter"
                    className={`w-full rounded-2xl border bg-black/30 px-4 py-3 pr-12 text-zinc-100 outline-none placeholder:text-zinc-500 focus:outline-none ${
                      password.length === 0
                        ? "border-white/10"
                        : pwOk
                        ? "border-emerald-400/40"
                        : "border-red-400/40"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-zinc-200 hover:bg-white/10"
                  >
                    {showPw ? "Gizle" : "Göster"}
                  </button>
                </div>
                {password.length > 0 && !pwOk && (
                  <p className="mt-2 text-xs text-red-200/90">Şifre en az 6 karakter olmalı.</p>
                )}
              </div>

              {msg && (
                <div className={`rounded-2xl border px-4 py-3 text-sm ${msgClass}`}>{msg}</div>
              )}

              <button
                disabled={!canSubmit}
                onClick={handleSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-medium text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading && (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                )}
                {loading
                  ? "İşleniyor..."
                  : mode === "signin"
                  ? "Giriş Yap"
                  : "Kayıt Ol"}
              </button>

              <div className="flex items-center justify-between text-sm text-zinc-400">
                <a href="/" className="hover:text-zinc-200">
                  Home
                </a>
                <span className="text-zinc-500">Enter ile gönder</span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-zinc-500">
            Dev aşamasında • Sonra Google giriş + şifre sıfırlama ekleriz.
          </p>
        </div>
      </div>
    </main>
  );
}
