import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-emerald-950 via-slate-950 to-black text-white">
      {/* Background accents */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-[520px] w-[520px] rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-10">
        {/* Hero */}
        <section className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left */}
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <Image
                  src="/logo.png"
                  alt="Hedimax"
                  fill
                  className="object-contain p-2"
                  priority
                />
              </div>
              <div className="leading-tight">
                <div className="text-xl font-semibold tracking-tight">Hedimax</div>
                <div className="text-sm text-white/60">
                  Earn rewards. Cash out fast.
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Earn from offerwalls,
              <span className="text-emerald-300"> cashout</span> in minutes.
            </h1>

            <p className="mt-4 max-w-xl text-base text-white/70">
              Complete offers, surveys and tasks. Track your points and withdraw
              quickly. Simple, fast and reliable.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/earn"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-400 px-5 text-sm font-semibold text-black transition hover:bg-emerald-300"
              >
                Start Earning
              </Link>
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>

            {/* Minimal bullets */}
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="text-sm font-semibold">Multiple Providers</div>
                <div className="mt-1 text-sm text-white/65">
                  Access different offerwall sources from one place.
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                <div className="text-sm font-semibold">Secure Points</div>
                <div className="mt-1 text-sm text-white/65">
                  RLS protected points system with reliable tracking.
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-emerald-500/10 blur-2xl" />
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur">
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src="/hero.png"
                  alt="Hedimax hero"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-14">
          <h2 className="text-2xl font-semibold tracking-tight">
            How it works
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-emerald-200">1</div>
              <div className="mt-2 text-base font-semibold">Sign in</div>
              <div className="mt-1 text-sm text-white/65">
                Create an account and access your dashboard.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-emerald-200">2</div>
              <div className="mt-2 text-base font-semibold">Complete offers</div>
              <div className="mt-1 text-sm text-white/65">
                Use /earn to choose a provider and start earning.
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-emerald-200">3</div>
              <div className="mt-2 text-base font-semibold">Cashout</div>
              <div className="mt-1 text-sm text-white/65">
                Withdraw your balance quickly and securely.
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-white/10 pt-8 text-sm text-white/55">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>© {new Date().getFullYear()} Hedimax</div>
            <div className="flex items-center gap-4">
              <Link className="hover:text-white" href="/terms">
                Terms
              </Link>
              <Link className="hover:text-white" href="/privacy">
                Privacy
              </Link>
              <Link className="hover:text-white" href="/support">
                Support
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
