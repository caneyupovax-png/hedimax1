"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/lib/useUser"; // sende farklıysa değiştir

type Offer = {
  id: string | number;
  title: string;
  reward: number;
  duration: number | null;
  url: string;
  provider: "cpx";
};

export default function OfferwallPage() {
  const { user, loading: userLoading } = useUser(); // user?.id bekliyorum
  const userId = user?.id || "";

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  const canFetch = useMemo(() => !!userId, [userId]);

  useEffect(() => {
    if (!canFetch) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr("");

      try {
        const res = await fetch(`/api/offerwall/cpx?user_id=${encodeURIComponent(userId)}`, {
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "Offerwall error");
        }

        if (!cancelled) {
          setOffers(Array.isArray(json.offers) ? json.offers : []);
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to load offers");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canFetch, userId]);

  if (userLoading) {
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
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Earn</h1>
          <p className="text-white/60 text-sm">
            Complete surveys to earn coins.
          </p>
        </div>

        <button
          className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 border border-white/10"
          onClick={() => location.reload()}
        >
          Refresh
        </button>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          {err}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          Loading offers...
        </div>
      ) : null}

      {!loading && !err && offers.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          No surveys available right now.
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {offers.map((offer) => {
          const reward = Number.isFinite(offer.reward) ? offer.reward : 0;

          return (
            <button
              key={`${offer.provider}-${offer.id}`}
              className="text-left rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
              onClick={() => window.open(offer.url, "_blank", "noopener,noreferrer")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-white font-medium truncate">
                    {offer.title}
                  </div>

                  <div className="mt-1 text-xs text-white/60">
                    Provider: CPX
                    {offer.duration ? ` • ${offer.duration} min` : ""}
                  </div>
                </div>

                <div className="shrink-0 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-3 py-1">
                  <div className="text-yellow-200 font-semibold">
                    {reward} Coins
                  </div>
                </div>
              </div>

              <div className="mt-3 text-sm text-white/70">
                Tap to start →
              </div>
            </button>
          );
        })}
      </div>
    </main>
  );
}
