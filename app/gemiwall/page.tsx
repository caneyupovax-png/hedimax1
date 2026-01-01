"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export const dynamic = "force-dynamic";

export default function GemiWallPage() {
  const supabase = useMemo(() => createClient(), []);
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setErr("");
      setSrc(null);

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        if (!cancelled) setErr("Please sign in to access GemiWall.");
        return;
      }

      const placementId = process.env.NEXT_PUBLIC_GEMIWALL_PLACEMENT_ID;
      if (!placementId) {
        if (!cancelled) setErr("Missing env: NEXT_PUBLIC_GEMIWALL_PLACEMENT_ID");
        return;
      }

      // ✅ Recommended: Path Parameters
      const url = `https://gemiwall.com/${encodeURIComponent(
        placementId
      )}/${encodeURIComponent(user.id)}`;

      if (!cancelled) setSrc(url);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return (
    <div className="min-h-screen w-full bg-[#070A12] text-white px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight">GemiWall</h1>
          <p className="mt-1 text-sm text-white/60">
            Complete offers and earn coins.
          </p>
        </div>

        {err ? (
          <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-4 text-white/80">
            {err}
          </div>
        ) : !src ? (
          <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/10 p-4 text-white/70">
            Loading…
          </div>
        ) : (
          <div className="rounded-3xl overflow-hidden ring-1 ring-white/10 bg-white/[0.02]">
            <iframe
              src={src}
              className="w-full h-[78vh]"
              style={{ border: "none" }}
              allow="clipboard-write; fullscreen"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </div>
    </div>
  );
}
