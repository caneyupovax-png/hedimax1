"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type CpxResp =
  | { ok: true; offerwall_url?: string; url?: string }
  | { ok: false; error?: string };

export default function EarnPage() {
  const [userId, setUserId] = useState<string>("");
  const [authReady, setAuthReady] = useState(false);

  const [offerwallUrl, setOfferwallUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase =
    SUPABASE_URL && SUPABASE_ANON
      ? createClient(SUPABASE_URL, SUPABASE_ANON)
      : null;

  // ✅ Auth: session var mı? yoksa hata verme, user yok de.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!supabase) {
          throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
          );
        }

        // session varsa user al
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (!cancelled) {
          setUserId(session?.user?.id || "");
          setAuthReady(true);
        }

        // session değişirse güncelle
        const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
          setUserId(sess?.user?.id || "");
        });

        return () => {
          sub.subscription.unsubscribe();
        };
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Auth error");
          setAuthReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // CPX link al
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `/api/offerwall/cpx?user_id=${encodeURIComponent(userId)}`,
          { cache: "no-store" }
        );

        const json: CpxResp = await res.json().catch(() => ({ ok: false }));

        if (!res.ok || (json as any)?.ok !== true) {
          throw new Error((json as any)?.error || `CPX error: HTTP ${res.status}`);
        }

        const url = (json as any).offerwall_url || (json as any).url || "";
        if (!url) throw new Error("CPX error: offerwall_url missing");

        if (!cancelled) setOfferwallUrl(url);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load CPX");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  // ✅ Login yoksa normal mesaj (refresh token error basmayız)
  if (!userId) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-4">
        <div className="text-xl font-semibold">Please sign in</div>
        <div className="mt-2 text-white/60 text-sm text-center">
          Your session is missing or expired. Go to Login and sign in again.
        </div>
        <a
          href="/login"
          className="mt-6 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-3"
        >
          Go to Login →
        </a>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Earn</h1>
        <p className="mt-2 text-white/60">
          Complete surveys via CPX Offerwall.
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 whitespace-pre-wrap">
            {error}
          </div>
        )}

        <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-6">
          {loading ? (
            <div className="text-white/70">Loading offerwall…</div>
          ) : offerwallUrl ? (
            <a
              href={offerwallUrl}
              target="_blank"
              rel="noreferrer"
              className="block w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-4 text-center font-medium"
            >
              Open CPX Offerwall →
            </a>
          ) : (
            <div className="text-white/60">Offerwall link not available.</div>
          )}

          <button
            className="mt-4 w-full rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-3"
            onClick={() => location.reload()}
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 text-xs text-white/40 break-all">
          debug user_id: {userId}
        </div>
      </div>
    </main>
  );
}
