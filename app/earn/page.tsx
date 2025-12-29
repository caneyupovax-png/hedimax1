"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Partner = {
  name: string;
  slug: string;
  kind: "offerwall" | "survey";
  comingSoon?: boolean;
  subtitle?: string;
  badge?: string;
};

export default function EarnPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [username, setUsername] = useState("Guest");
  const [balance, setBalance] = useState(0);

  const PARTNERS: Partner[] = useMemo(
    () => [
      // Offerwalls (disabled / coming soon)
      {
        name: "AdGate",
        slug: "adgate",
        kind: "offerwall",
        comingSoon: true,
        subtitle: "Offers and tasks",
      },
      {
        name: "AyetStudios",
        slug: "ayetstudios",
        kind: "offerwall",
        comingSoon: true,
        subtitle: "Mobile offers",
      },
      {
        name: "Lootably",
        slug: "lootably",
        kind: "offerwall",
        comingSoon: true,
        subtitle: "Games and offers",
      },

      // Surveys
      {
        name: "CPX Research",
        slug: "cpx",
        kind: "survey",
        comingSoon: false,
        subtitle: "Surveys (opens in a new tab)",
        badge: "Recommended",
      },
      {
        name: "BitLabs",
        slug: "bitlabs",
        kind: "survey",
        comingSoon: true,
        subtitle: "Surveys",
      },
      {
        name: "YourSurveys",
        slug: "yoursurveys",
        kind: "survey",
        comingSoon: true,
        subtitle: "Surveys",
      },
      {
        name: "Prime Surveys",
        slug: "primesurveys",
        kind: "survey",
        comingSoon: true,
        subtitle: "Surveys",
      },
    ],
    []
  );

  const offerwalls = PARTNERS.filter((p) => p.kind === "offerwall");
  const surveys = PARTNERS.filter((p) => p.kind === "survey");

  useEffect(() => {
    let alive = true;

    const load = async () => {
      setLoading(true);

      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!alive) return;

      if (!user) {
        setIsAuthed(false);
        setUsername("Guest");
        setBalance(0);
        setLoading(false);
        return;
      }

      setIsAuthed(true);

      const name =
        (user.user_metadata as any)?.username ||
        (user.user_metadata as any)?.name ||
        (user.email ? String(user.email).split("@")[0] : "User");

      setUsername(String(name));

      const { data: pb } = await supabase
        .from("points_balance")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      setBalance(Number(pb?.balance ?? 0));
      setLoading(false);
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPartner = async (p: Partner) => {
    if (p.comingSoon) return;

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      router.push(`/login?next=/earn`);
      return;
    }

    if (p.slug === "cpx") {
      const res = await fetch(
        `/api/offerwall/cpx?user_id=${encodeURIComponent(user.id)}`,
        { cache: "no-store" }
      );

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok || !json?.ok || !json?.url) {
        alert(json?.error || `Failed to open CPX (HTTP ${res.status})`);
        return;
      }

      window.open(json.url, "_blank", "noopener,noreferrer");
      return;
    }

    router.push(`/offerwall/${p.slug}`);
  };

  return (
    <div>
      {/* ✅ NO guest flash: only show after loading is done */}
      {!loading && !isAuthed && (
        <div className="card-glass p-6">
          <div className="text-2xl font-extrabold text-white">
            Continue as Guest
          </div>
          <div className="mt-2 text-sm text-white/65 max-w-2xl">
            Login to track coins and open survey partners.
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/?auth=login" className="btn-primary inline-flex">
              Login
            </Link>
            <Link href="/?auth=register" className="btn-ghost inline-flex">
              Create account
            </Link>
          </div>
        </div>
      )}

      <Section
        title="Offerwall Partners"
        subtitle="Offerwalls are currently disabled. They will be available soon."
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offerwalls.map((p) => (
          <PartnerTile key={p.slug} p={p} onOpen={openPartner} />
        ))}
      </div>

      <div className="mt-12">
        <Section
          title="Survey Partners"
          subtitle="Choose a survey partner to start earning coins."
        />

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {surveys.map((p) => (
            <PartnerTile key={p.slug} p={p} onOpen={openPartner} />
          ))}
        </div>
      </div>

      <div className="mt-12 card-glass p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-white font-semibold">Hedimax rate</div>
          <div className="text-white/75 text-sm">
            1 USD = <span className="text-white font-semibold">1000 coin</span>
          </div>
        </div>
        <div className="mt-2 text-white/60 text-sm">
          Coins are credited automatically after completion via postback.
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mt-10">
      <h2 className="text-2xl font-extrabold text-white">{title}</h2>
      <div className="mt-2 text-sm text-white/65 max-w-2xl">{subtitle}</div>
    </div>
  );
}

function PartnerTile({
  p,
  onOpen,
}: {
  p: Partner;
  onOpen: (p: Partner) => void;
}) {
  const disabled = !!p.comingSoon;

  return (
    <div className="card-glass p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-white font-extrabold text-lg leading-tight">
            {p.name}
          </div>
          <div className="mt-2 text-sm text-white/60">{p.subtitle || ""}</div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {p.badge ? <span className="pill">{p.badge}</span> : null}
          {disabled ? <span className="pill">Coming soon</span> : null}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="text-xs text-white/50">
          {p.kind === "survey" ? "Surveys" : "Offerwalls"}
        </div>

        <button
          type="button"
          onClick={() => onOpen(p)}
          disabled={disabled}
          className={[
            disabled ? "btn-ghost" : "btn-primary",
            "disabled:opacity-60",
          ].join(" ")}
        >
          {disabled ? "Unavailable" : "Open"}
        </button>
      </div>
    </div>
  );
}
