"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const PROVIDERS: Record<
  string,
  { name: string; url?: string; note?: string }
> = {
  bitlabs: { name: "BitLabs", url: "" },
  ayet: { name: "AyetStudios", url: "" },
  adgem: { name: "AdGem", url: "" },
  cpx: { name: "CPX Research", url: "" },
};

function getProviderFromLocation() {
  if (typeof window === "undefined") return null;
  const sp = new URLSearchParams(window.location.search);
  return sp.get("provider");
}

export default function OfferwallPage() {
  const [email, setEmail] = useState<string>("");
  const [providerKey, setProviderKey] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? "");
      setProviderKey(getProviderFromLocation());
    })();
  }, []);

  const username = useMemo(() => {
    if (!email) return "User";
    const part = email.split("@")[0] || "User";
    return part.length > 14 ? part.slice(0, 14) + "…" : part;
  }, [email]);

  const provider = providerKey ? PROVIDERS[providerKey] : null;

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top Nav */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white text-zinc-950 grid place-items-center font-extrabold">
              H
            </div>
            <div className="leading-tight">
              <div className="text-sm text-zinc-400">Hedimax</div>
              <div className="text-base font-semibold">
                Offerwall • Hi, {username}
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <a
              href="/earn"
              className="rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 hover:bg-white/10"
            >
              Earn
            </a>
            <a
              href="/cashout"
              className="rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 hover:bg-white/10"
            >
              Cashout
            </a>
            <a
              href="/dashboard"
              className="rounded-xl px-3 py-2 text-sm bg-white/5 border border-white/10 hover:bg-white/10"
            >
              Dashboard
            </a>
            <button
              onClick={signOut}
              className="rounded-xl px-3 py-2 text-sm bg-white text-zinc-950 font-medium hover:bg-zinc-200"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {!providerKey ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-semibold">Choose an offerwall</div>
            <div className="mt-2 text-sm text-zinc-400">
              Go to the Earn page and select an offerwall.
            </div>
            <a
              href="/earn"
              className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Back to Earn
            </a>
          </div>
        ) : !provider ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-semibold">Unknown provider</div>
            <div className="mt-2 text-sm text-zinc-400">
              Provider key: <code className="rounded bg-black/30 px-1 py-0.5">{providerKey}</code>
            </div>
            <a
              href="/earn"
              className="mt-4 inline-flex rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              Back to Earn
            </a>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-white/10 bg-black/20">
              <div>
                <div className="text-sm text-zinc-400">Provider</div>
                <div className="text-lg font-semibold">{provider.name}</div>
              </div>
              <a
                href="/earn"
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              >
                ← Back
              </a>
            </div>

            {/* Content */}
            {provider.url ? (
              <div className="h-[75vh]">
                <iframe
                  src={provider.url}
                  className="w-full h-full"
                  allow="clipboard-read; clipboard-write"
                />
              </div>
            ) : (
              <div className="p-6">
                <div className="text-sm text-zinc-400">
                  This offerwall is not connected yet.
                </div>
                <div className="mt-2 text-sm text-zinc-300">
                  Send me the embed/link URL for <b>{provider.name}</b> and I’ll plug it in.
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
