"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function DashboardPage() {
  const supabase = createClient();
  const [points, setPoints] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user) {
        if (alive) {
          setPoints(null);
          setLoading(false);
        }
        return;
      }

      // Örnek: senin points tablonun yapısına göre uyarlaman gerekebilir.
      // Burada sadece "puan çekme" iskeleti var.
      const { data, error } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", user.id)
        .single();

      if (!alive) return;

      if (error) {
        setPoints(null);
        setLoading(false);
        return;
      }

      setPoints(typeof data?.points === "number" ? data.points : 0);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-white/65">
          Track your balance and recent activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur">
          <div className="text-sm text-white/60">Your Points</div>
          <div className="mt-2 text-3xl font-semibold">
            {loading ? "…" : points ?? 0}
          </div>
          <div className="mt-3 text-xs text-white/45">
            Updates automatically after earning.
          </div>
        </div>

        <div className="md:col-span-2 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur">
          <div className="text-base font-semibold">Activity</div>
          <div className="mt-2 text-sm text-white/65">
            (Placeholder) Show recent earnings/cashouts here.
          </div>
        </div>
      </div>
    </main>
  );
}
