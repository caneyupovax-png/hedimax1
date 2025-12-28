"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Offer = {
  id: string | number;
  title: string;
  reward: number;
  duration: number | null;
  url: string;
  provider: "cpx";
};

// ✅ Client-side Supabase (ANON KEY ile)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function OfferwallPage() {
  const [userId, setUserId] = useState<string>("");
  const [userLoading, setUserLoading] = useState(true);

  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  // 1) Kullanıcıyı çek
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        const id = data?.user?.id || "";
        if (!cancelled) setUserId(id);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message || "Failed to get user");
      } finally {
        if (!cancelled) setUserLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Offerları çek
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
  }, [userId]);

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
        Please sign i
