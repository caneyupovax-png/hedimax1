"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const PROVIDERS: Record<string, { name: string; url?: string }> = {
  cpxtask: { name: "CPX Research" },
  ayetstudios: { name: "Ayet Studios" },
  adgem: { name: "AdGem" },
  offertoro: { name: "OfferToro" },
};

export default function OfferwallPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const providerKey = (searchParams.get("provider") || "").toLowerCase().trim();

  const provider = useMemo(() => {
    return PROVIDERS[providerKey] || null;
  }, [providerKey]);

  // provider yoksa earn'e dön
  if (!providerKey || !provider) {
    return (
      <main className="py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Offerwall</h1>
        <p className="mt-2 text-white/65">
          Invalid provider. Please pick one from the Earn page.
        </p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.push("/earn")}
            className="h-11 rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-black hover:bg-emerald-300"
          >
            Go to Earn
          </button>
          <Link
            href="/"
            className="h-11 rounded-xl border border-white/15 bg-black/40 px-5 text-sm font-semibold text-white hover:bg-black/55"
          >
            Home
          </Link>
        </div>
      </main>
    );
  }

  // Burada sende mevcut embed mantığı neyse onu koruyabilirsin.
  // Şimdilik placeholder:
  return (
    <main className="py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{provider.name}</h1>
          <p className="mt-1 text-sm text-white/65">
            Provider: <span className="text-white/80">{providerKey}</span>
          </p>
        </div>

        <Link
          href="/earn"
          className="h-11 rounded-xl border border-white/15 bg-black/40 px-5 text-sm font-semibold text-white hover:bg-black/55 inline-flex items-center"
        >
          Back to Earn
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur p-6">
        <div className="text-sm text-white/70">
          Embed/iframe content goes here for <b>{provider.name}</b>.
        </div>
      </div>
    </main>
  );
}
