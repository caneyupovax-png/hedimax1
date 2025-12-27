"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const TITLES: Record<string, string> = {
  ayetstudios: "AyetStudios",
  adgate: "AdGate",
  lootably: "Lootably",
  bitlabs: "BitLabs",
};

function buildUrl(template: string, userId: string) {
  // Destek: {USER_ID} placeholder
  return template.replaceAll("{USER_ID}", encodeURIComponent(userId));
}

export default function OfferwallProviderPage() {
  const router = useRouter();
  const params = useParams<{ provider: string }>();
  const provider = (params?.provider || "").toLowerCase();
  const title = TITLES[provider] || provider;

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, anon);
  }, []);

  const [loading, setLoading] = useState(true);
  const [iframeUrl, setIframeUrl] = useState<string>("");
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setErr("");

      // 1) session kontrol
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.push("/login");
        return;
      }

      // 2) provider env linkini seç
      const templates: Record<string, string | undefined> = {
        ayetstudios: process.env.NEXT_PUBLIC_OFFERWALL_AYET_URL,
        adgate: process.env.NEXT_PUBLIC_OFFERWALL_ADGATE_URL,
        lootably: process.env.NEXT_PUBLIC_OFFERWALL_LOOTABLY_URL,
        bitlabs: process.env.NEXT_PUBLIC_OFFERWALL_BITLABS_URL,
      };

      const t = templates[provider];

      if (!t) {
        setErr(
          `Missing env for ${provider}. Add NEXT_PUBLIC_OFFERWALL_${provider.toUpperCase()}_URL in Vercel.`
        );
        setLoading(false);
        return;
      }

      // 3) URL oluştur
      setIframeUrl(buildUrl(t, user.id));
      setLoading(false);
    };

    run();
  }, [provider, router, supabase]);

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/earn" className="text-lg font-semibold">
              HEDIMAX
            </Link>

            <nav className="hidden sm:flex items-center gap-6 text-sm text-white/70">
              <Link className="hover:text-white" href="/earn">
                Earn
              </Link>
              <Link className="hover:text-white" href="/cashout">
                Cashout
              </Link>
            </nav>
          </div>

          <Link
            href="/earn"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:border-white/20"
          >
            ← Back to Earn
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{title}</h1>
              <p className="mt-1 text-sm text-white/60">
                Offerwall is loaded via iframe.
              </p>
            </div>
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:border-white/20"
            >
              Dashboard
            </Link>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-2">
            {loading ? (
              <div className="p-6 text-white/70">Loading offerwall…</div>
            ) : err ? (
              <div className="p-6 text-red-200">{err}</div>
            ) : (
              <iframe
                src={iframeUrl}
                className="h-[75vh] w-full rounded-xl"
                allow="clipboard-write; fullscreen"
              />
            )}
          </div>

          {!loading && !err && (
            <div className="mt-3 text-xs text-white/40 break-all">
              iframe src: {iframeUrl}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
