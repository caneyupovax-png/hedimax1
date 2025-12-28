"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function OfferwallPage() {
  const [userId, setUserId] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);

  const [offerwallUrl, setOfferwallUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const supabase =
    SUPABASE_URL && SUPABASE_ANON
      ? createClient(SUPABASE_URL, SUPABASE_ANON)
      : null;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!supabase) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / ANON KEY");

        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (!cancelled) setUserId(data?.user?.id || "");
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to get user");
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr("");

      try {
        const res = await fetch(`/api/offerwall/cpx?user_id=${encodeURIComponent(userId)}`, {
          cache: "no-store",
        });
        const json = await res.json();

        if (!res.ok || !json?.ok) throw new Error(json?.error || "Failed to get offerwall url");

        if (!cancelled) setOfferwallUrl(json.offerwall_url || "");
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load offerwall");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loadingUser) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white/80">
        Loading user...
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-white/80">
        Please sign in.
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-white">Earn</h1>
      <p className="mt-2 text-white/60">
        Open CPX Offerwall to complete surveys.
      </p>

      {err ? (
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          {err}
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <button
          disabled={!offerwallUrl || loading}
          className="w-full rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-4 text-white disabled:opacity-50"
          onClick={() => window.open(offerwallUrl, "_blank", "noopener,noreferrer")}
        >
          {loading ? "Loading..." : "Open CPX Offerwall →"}
        </button>

        <div className="mt-3 text-xs text-white/50">
          Not: Ödül/puan CPX ekranında görünmeyebilir; kazanım postback ile puana yansır.
        </div>
      </div>
    </main>
  );
}
