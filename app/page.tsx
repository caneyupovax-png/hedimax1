// app/page.tsx
import Link from "next/link";

const stats = [
  { label: "Users", value: "2M+" },
  { label: "Rewards paid", value: "$10M+" },
  { label: "Avg. cashout time", value: "5 min" },
  { label: "Offer partners", value: "50+" },
];

const earnCards = [
  { title: "Surveys", desc: "Short surveys with fast rewards." },
  { title: "Apps", desc: "Install & complete steps to earn." },
  { title: "Games", desc: "Reach milestones for bigger payouts." },
  { title: "Sign-ups", desc: "Quick offers with easy requirements." },
  { title: "Videos", desc: "Watch content and earn in downtime." },
  { title: "Trials", desc: "Try subscriptions for higher value." },
];

const leaderboard = [
  { name: "PlayerOne", amount: "$1,240" },
  { name: "Nora", amount: "$980" },
  { name: "Kaan", amount: "$770" },
  { name: "Mila", amount: "$640" },
];

const rewards = [
  { title: "PayPal", desc: "Fast withdrawals", tag: "Popular" },
  { title: "Gift Cards", desc: "Amazon, Steam, iTunes", tag: "Instant" },
  { title: "Crypto", desc: "USDT, BTC, ETH", tag: "Flexible" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute top-72 left-24 h-[320px] w-[320px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-96 right-24 h-[360px] w-[360px] rounded-full bg-red-500/10 blur-3xl" />
      </div>

      {/* NAVBAR (Red Monkey style) */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0B0F16]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          {/* Left brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white/5 ring-1 ring-white/10">
              <span className="text-lg">🐵</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold tracking-wide">RED</span>
              <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-extrabold tracking-wide text-white shadow-[0_0_20px_rgba(239,68,68,0.25)]">
                Monkey
              </span>
            </div>
          </Link>

          {/* Center menu */}
          <nav className="hidden items-center gap-10 md:flex">
            {[
              { label: "EARN", href: "#earn" },
              { label: "CASHOUT", href: "#cashout" },
              { label: "LEADERBOARD", href: "#leaderboard" },
              { label: "REWARDS", href: "#rewards" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-bold tracking-widest text-white/70 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full bg-gradient-to-b from-red-500 to-red-700 px-6 py-2 text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(239,68,68,0.25)] ring-1 ring-red-300/30 hover:brightness-110"
            >
              Sign In
            </Link>

            <Link
              href="/login"
              className="rounded-full bg-[#141A24] px-6 py-2 text-sm font-extrabold text-white/90 ring-2 ring-red-500/50 hover:text-white hover:ring-red-400"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* HERO / EARN */}
      <section id="earn" className="mx-auto max-w-6xl px-4 pt-14 pb-10 md:pt-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Earn rewards from offers you actually like
            </div>

            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Earn rewards.
              <span className="text-red-300"> Cashout fast.</span>
            </h1>

            <p className="mt-4 max-w-xl text-base text-white/70 md:text-lg">
              Choose offers, complete steps, and withdraw quickly. Clean UI — Freecash-style.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90"
              >
                Get started
              </Link>

              <a
                href="#cashout"
                className="inline-flex items-center justify-center rounded-2xl bg-white/5 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
              >
                See cashout options
              </a>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <div className="text-lg font-bold">{s.value}</div>
                  <div className="mt-1 text-xs text-white/60">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: earn cards */}
          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
            <div className="text-sm font-extrabold tracking-widest text-white/80">EARN</div>
            <div className="mt-1 text-xs text-white/60">Pick a category to start</div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {earnCards.map((c) => (
                <div
                  key={c.title}
                  className="rounded-2xl bg-[#0B0F16] p-4 ring-1 ring-white/10 hover:ring-white/20"
                >
                  <div className="text-sm font-semibold">{c.title}</div>
                  <div className="mt-1 text-xs text-white/60">{c.desc}</div>
                </div>
              ))}
            </div>

            <Link
              href="/login"
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-b from-red-500 to-red-700 px-4 py-3 text-sm font-extrabold text-white ring-1 ring-red-300/30 hover:brightness-110"
            >
              Open offerwall
            </Link>
          </div>
        </div>
      </section>

      {/* CASHOUT */}
      <section id="cashout" className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 md:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Cashout</h2>
              <p className="mt-2 text-sm text-white/65">
                Withdraw via PayPal, gift cards, or crypto — fast processing.
              </p>
            </div>
            <Link
              href="/login"
              className="hidden rounded-full bg-[#141A24] px-5 py-2 text-sm font-extrabold text-white/90 ring-2 ring-red-500/50 hover:ring-red-400 md:inline-flex"
            >
              Withdraw →
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {rewards.map((r) => (
              <div key={r.title} className="rounded-3xl bg-[#0B0F16] p-5 ring-1 ring-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">{r.title}</div>
                    <div className="mt-2 text-sm text-white/65">{r.desc}</div>
                  </div>
                  <div className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-200 ring-1 ring-red-500/25">
                    {r.tag}
                  </div>
                </div>

                <Link
                  href="/login"
                  className="mt-5 inline-flex rounded-2xl bg-white/5 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
                >
                  Select →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEADERBOARD */}
      <section id="leaderboard" className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 md:p-8">
          <h2 className="text-2xl font-extrabold tracking-tight">Leaderboard</h2>
          <p className="mt-2 text-sm text-white/65">Top earners this week.</p>

          <div className="mt-6 grid gap-3">
            {leaderboard.map((row, idx) => (
              <div
                key={row.name}
                className="flex items-center justify-between rounded-2xl bg-[#0B0F16] px-4 py-3 ring-1 ring-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 font-extrabold ring-1 ring-white/10">
                    {idx + 1}
                  </div>
                  <div className="font-semibold">{row.name}</div>
                </div>

                <div className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-black">
                  {row.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REWARDS */}
      <section id="rewards" className="mx-auto max-w-6xl px-4 py-14">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-500/15 via-white/5 to-red-500/15 p-6 ring-1 ring-white/10 md:p-10">
          <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />

          <div className="relative grid gap-6 md:grid-cols-2 md:items-center">
            <div>
              <h3 className="text-2xl font-extrabold tracking-tight">Rewards & bonuses</h3>
              <p className="mt-2 text-sm text-white/70">
                Daily streaks, referral bonuses, and limited-time boosts.
              </p>
              <div className="mt-4 text-xs text-white/60">
                Sign in to view your personalized reward hub.
              </div>
            </div>

            <div className="rounded-3xl bg-[#0B0F16]/70 p-4 ring-1 ring-white/10 md:p-5">
              <div className="grid gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-red-500 to-red-700 px-5 py-3 text-sm font-extrabold text-white ring-1 ring-red-300/30 hover:brightness-110"
                >
                  Open rewards
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-white/5 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
                >
                  Create account
                </Link>
                <div className="text-center text-xs text-white/55">Secure auth powered by Supabase</div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/55 md:flex-row">
          <div>© {new Date().getFullYear()} Hedimax</div>
          <div className="flex items-center gap-4">
            <a className="hover:text-white" href="#">
              Terms
            </a>
            <a className="hover:text-white" href="#">
              Privacy
            </a>
            <a className="hover:text-white" href="#">
              Support
            </a>
          </div>
        </footer>
      </section>
    </main>
  );
}
