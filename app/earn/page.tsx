"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type ApiResp =
  | { ok: true; offerwall_url?: string; url?: string }
  | { ok: false; error?: string };

export default function EarnPage() {
  const [userId, setUserId] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);

  const [offerwallUrl, setOfferwallUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const supabase =
    SUPABASE_URL && SUPABASE_ANON
      ? createClient(SUPABASE_URL, SUPABASE_ANON)
      : null;

  // 1) userId çek
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

  // 2) offerwall link çek
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr("");

      try {
        const res = await fetch(
          `/api/offerwall/cpx?user_id=${encodeURIComponent(userId)}`,
          { cache: "no-store" }
        );

        const json: ApiResp = await res.json().catch(() => ({ ok: false }));

        if (!res.ok || !("ok" in json) || json.ok === false) {
          const msg =
            (json as any)?.error ||
            `HTTP ${res.status} (${res.statusText || "error"})`;
          throw new Error(`CPX error: ${msg}`);
        }

        const url = (json as any).offerwall_url || (json as any).url || "";
        if (!url) throw new Error("CPX error: missing offerwall_url in response");

        if (!cancelled) setOfferwallUrl(url);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load offerwall link");
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
        <div className="mt-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200 whitespace-pre-wrap">
          {err}
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        {loading ? (
          <div className="text-white/70">Loading offerwall link...</div>
        ) : offerwallUrl ? (
          // ✅ Popup blocker yok: a etiketi
          <a
            href={offerwallUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-4 text-white"
          >
            Open CPX Offerwall →
          </a>
        ) : (
          <div className="text-white/70">Offerwall link not ready.</div>
        )}

        <button
          className="mt-4 w-full rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-3 text-white"
          onClick={() => location.reload()}
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 text-xs text-white/50">
        Debug: user_id = {userId}
      </div>
    </main>
  );
}
