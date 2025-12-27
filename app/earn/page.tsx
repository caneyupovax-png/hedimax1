import Link from "next/link";

const providers = [
  { key: "cpxtask", name: "CPX Research" },
  { key: "ayetstudios", name: "Ayet Studios" },
  { key: "adgem", name: "AdGem" },
  { key: "offertoro", name: "OfferToro" },
];

export default function EarnPage() {
  return (
    <main className="py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Earn</h1>
        <p className="mt-1 text-sm text-white/65">
          Choose a provider to start earning points.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => (
          <Link
            key={p.key}
            href={`/offerwall?provider=${encodeURIComponent(p.key)}`}
            className="rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur transition hover:border-emerald-400/30 hover:bg-black/50"
          >
            <div className="text-base font-semibold">{p.name}</div>
            <div className="mt-1 text-sm text-white/60">Open offerwall</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
