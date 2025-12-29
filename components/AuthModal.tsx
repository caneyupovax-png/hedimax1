"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/utils/supabase/client";

type Mode = "login" | "register";

export default function AuthModal({
  open,
  mode,
  onClose,
  onModeChange,
}: {
  open: boolean;
  mode: Mode;
  onClose: () => void;
  onModeChange: (m: Mode) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [mounted, setMounted] = useState(false);

  // animation state
  const [show, setShow] = useState(false); // portal render + enter/exit
  const [closing, setClosing] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error" | null>(null);

  useEffect(() => setMounted(true), []);

  // open/close with animation
  useEffect(() => {
    if (!mounted) return;

    if (open) {
      setShow(true);
      setClosing(false);
      // next tick -> enter
      requestAnimationFrame(() => setClosing(false));
    } else if (show) {
      // play exit animation then unmount
      setClosing(true);
      const t = window.setTimeout(() => {
        setShow(false);
        setClosing(false);
      }, 180);
      return () => window.clearTimeout(t);
    }
  }, [open, mounted, show]);

  // esc + body scroll lock
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // clear notices when mode changes while open
  useEffect(() => {
    if (!open) return;
    setMsg(null);
    setMsgType(null);
  }, [open, mode]);

  const setNotice = (type: "success" | "error", text: string) => {
    setMsgType(type);
    setMsg(text);
  };

  const submit = async () => {
    setMsg(null);
    setMsgType(null);

    const e = email.trim();
    if (!e.includes("@") || e.length < 5) {
      setNotice("error", "Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setNotice("error", "Password must be at least 6 characters.");
      return;
    }

    try {
      setBusy(true);

      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: e,
          password,
        });
        if (error) {
          setNotice("error", error.message);
          return;
        }
        if (data.session) {
          onClose();
          window.location.href = "/dashboard";
          return;
        }
        setNotice("success", "Signed in.");
        onClose();
        return;
      }

      const redirectTo = `${window.location.origin}/dashboard`;
      const { data, error } = await supabase.auth.signUp({
        email: e,
        password,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        setNotice("error", error.message);
        return;
      }

      if (data.session) {
        onClose();
        window.location.href = "/dashboard";
        return;
      }

      setNotice(
        "success",
        "Account created. Confirmation email sent. Please check your inbox (and spam)."
      );
      setPassword("");
    } finally {
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    setMsg(null);
    setMsgType(null);

    const e = email.trim();
    if (!e.includes("@") || e.length < 5) {
      setNotice("error", "Enter your email first.");
      return;
    }

    try {
      setBusy(true);
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(e, {
        redirectTo,
      });
      if (error) {
        setNotice("error", error.message);
        return;
      }
      setNotice("success", "Password reset email sent.");
    } finally {
      setBusy(false);
    }
  };

  if (!mounted || !show) return null;

  const backdropClass =
    "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 " +
    (closing ? "opacity-0" : "opacity-100");

  const panelClass =
    "w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] shadow-2xl overflow-hidden " +
    "transition-all duration-200 will-change-transform " +
    (closing ? "opacity-0 translate-y-2 scale-[0.98]" : "opacity-100 translate-y-0 scale-100");

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      {/* backdrop (click to close) */}
      <button aria-label="Close" onClick={onClose} className={backdropClass} />

      {/* panel */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={panelClass}>
          {/* header */}
          <div
            className="px-6 py-5"
            style={{
              background:
                "radial-gradient(600px 240px at 50% 0%, rgba(16,185,129,0.22), transparent 60%), linear-gradient(to bottom, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-xl font-extrabold">
                {mode === "login" ? "Sign In" : "Create Account"}
              </div>

              <button
                onClick={onClose}
                className="h-10 w-10 rounded-full border border-white/10 bg-black/20 hover:bg-black/30 transition"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 flex gap-2 text-xs">
              <button
                onClick={() => onModeChange("login")}
                className={[
                  "px-3 py-1.5 rounded-full border transition",
                  mode === "login"
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                    : "border-white/10 bg-white/5 text-white/70 hover:text-white",
                ].join(" ")}
              >
                Sign In
              </button>
              <button
                onClick={() => onModeChange("register")}
                className={[
                  "px-3 py-1.5 rounded-full border transition",
                  mode === "register"
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                    : "border-white/10 bg-white/5 text-white/70 hover:text-white",
                ].join(" ")}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* body */}
          <div className="px-6 py-6 space-y-3">
            <label className="block text-xs text-white/70">Email</label>
            <input
              className="input"
              placeholder="Type here..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
            />

            <label className="block text-xs text-white/70 mt-2">Password</label>
            <input
              className="input"
              placeholder="Type here..."
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />

            {mode === "login" ? (
              <div className="flex justify-end">
                <button
                  onClick={forgotPassword}
                  disabled={busy}
                  className="text-sm text-emerald-200 hover:text-emerald-100 underline underline-offset-4 disabled:opacity-60"
                >
                  Forgot your password?
                </button>
              </div>
            ) : null}

            {msg ? (
              <div
                className={[
                  "rounded-2xl border px-3 py-2 text-xs leading-relaxed",
                  msgType === "success"
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
                    : "border-red-400/30 bg-red-400/10 text-red-100",
                ].join(" ")}
              >
                {msg}
              </div>
            ) : null}

            <button
              onClick={submit}
              disabled={busy}
              className="btn-primary w-full mt-2 disabled:opacity-60"
            >
              {busy ? "Please wait..." : mode === "login" ? "Sign In" : "Create account"}
            </button>

            <div className="text-center text-xs text-white/55 pt-1">
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => onModeChange("register")}
                    className="text-white underline underline-offset-4"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => onModeChange("login")}
                    className="text-white underline underline-offset-4"
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
