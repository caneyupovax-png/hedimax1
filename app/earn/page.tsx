"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function EarnPage() {
  const [userId, setUserId] = useState("");
  const [userLoading, setUserLoading] = useState(true);

  const [offerwallUrl, setOfferwallUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const supabase =
    SUPABASE_URL && SUPABASE_ANON
      ? createClient(SUPABASE_URL, SUPABASE_ANON)
      : null;

  // 🔹 Kullanıcıyı al
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!supabase) {
          throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
          );
        }

        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (!cancelled) setUserId(data?.user?.id || "");
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to get user");
      } finally {
        if (!cancelled) setUserLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 🔹 CPX Offerwall linkini al
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

        const json = await res.json().catch(() => ({}));

        if (!res.ok || json?.ok !== true) {
          throw new Error(
            json?.error || `CPX error: HTTP ${res.status}`
          );
        }

        const url = json.offerwall_url || json.url;
        if (!url) {
          throw new Error("CPX error: offerwall_url missing");
        }

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

  // 🔻 Yükleniyor (user)
  if (userLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading user...
      </div>
    );
  }

  // 🔻 Login yok
  if (!userId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Please sign in
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
            <div className="text-white/60">
              Offerwall link not available.
            </div>
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
