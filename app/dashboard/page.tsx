// app/dashboard/page.tsx
import Link from "next/link";

const stats = [
  { label: "Today", value: "$4.20" },
  { label: "This week", value: "$18.70" },
  { label: "Pending", value: "$6.10" },
  { label: "Cashout time", value: "5 min" },
];

const offerwallCards = [
  { title: "Surveys", desc: "High-converting surveys updated daily.", badge: "Top picks" },
  { title: "Apps", desc: "Install and complete steps to earn.", badge: "Fast" },
  { title: "Games", desc: "Play and reach milestones for rewards.", badge: "Popular" },
  { title: "Sign-ups", desc: "Quick registrations with easy steps.", badge: "Easy" },
  { title: "Videos", desc: "Watch content and earn passively.", badge: "Chill" },
  { title: "Trials", desc: "Try subscriptions for bigger rewards.", badge: "High value" },
];

const bigPayouts = [
  { name: "Game milestone unlock", payout: "$25" },
  { name: "7-day app trial", payout: "$19" },
  { name: "Finance KYC + deposit", payout: "$15" },
  { name: "Featured survey pack", payout: "$11" },
];

export default function DashboardPage() {
  // ✅ Later: replace with Supabase user + points from DB
  const userName = "User";
  const points = 12450; // example
  const pointsLabel = points.toLocaleString();

  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-72 left-24 h-[320px] w-[320px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute top-96 right-24 h-[360px] w-[360px] rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      {/* NAVBAR (landing ile aynı, sağ üstte user + points) */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070A12]/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <span className="text-sm font-black tracking-tight">HX</span>
            </div>
            <span className="font-semibold tracking-tight">Hedimax</span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <a className="text-sm text-white/70 hover:text-white" href="#offers">
              Offers
            </a>
            <a className="text-sm text-white/70 hover:text-white" href="#high">
              High paying
            </a>
            <a className="text-sm text-white/70 hover:text-white" href="#cashout">
              Cashout
            </a>
          </nav>

          {/* ✅ Right top: points + username */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10">
                <span className="text-xs font-bold">⭐</span>
              </div>
              <div className="leading-tight">
                <div className="text-xs text-white/60">Points</div>
                <div className="text-sm font-extrabold">{pointsLabel}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 ring-1 ring-white/10">
                <span className="text-xs font-bold">{userName.slice(0, 1).toUpperCase()}</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-xs text-white/60">Signed in as</div>
                <div className="text-sm font-semibold">{userName}</div>
              </div>
              <Link
                href="/login"
                className="ml-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/10 hover:bg-white/15"
              >
                Log out
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* HEADER / HERO */}
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-6 md:pt-14">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs text-white/70 ring-1 ring-white/10">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Welcome back — start earning now
        </div>

        <div className="mt-5 grid gap-8 md:grid-cols-2 md:items-start">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              Your offerwall is ready.
              <br className="hidden md:block" />
              Pick a task and earn.
            </h1>

            <p className="mt-3 max-w-xl text-sm text-white/70 md:text-base">
              Same look as the landing page — but optimized for daily earning. Track your progress, find
              high-paying offers, and cash out quickly.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                  <div className="text-lg font-bold">{s.value}</div>
                  <div className="mt-1 text-xs text-white/60">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10">
            <div className="text-sm font-semibold">Quick actions</div>
            <div className="mt-1 text-xs text-white/60">Jump into earning faster</div>

            <div className="mt-5 grid gap-3">
              <a
                href="#offers"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90"
              >
                Browse offers
              </a>
              <a
                href="#high"
                className="inline-flex items-center justify-center rounded-2xl bg-white/5 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
              >
                High paying tasks
              </a>
              <a
                href="#cashout"
                className="inline-flex items-center justify-center rounded-2xl bg-white/5 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10"
              >
                Cashout options
              </a>
            </div>

            <div className="mt-6 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 p-4 ring-1 ring-white/10">
              <div className="text-sm font-semibold">Bonus tip</div>
              <div className="mt-1 text-xs text-white/70">
                High paying offers usually have limited slots — claim them early.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* OFFERS */}
      <section id="offers" className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Offers</h2>
            <p className="mt-2 text-sm text-white/65">
              Choose a category — in the next step we’ll hook this to your real offerwall data.
            </p>
          </div>
          <button className="hidden rounded-2xl bg-white/5 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10 md:inline-flex">
            Filter
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offerwallCards.map((c) => (
            <div
              key={c.title}
              className="group rounded-3xl bg-white/5 p-5 ring-1 ring-white/10 hover:bg-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{c.title}</div>
                  <div className="mt-2 text-sm text-white/65">{c.desc}</div>
                </div>
                <div className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/10">
                  {c.badge}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div className="text-xs text-white/55">Instant tracking • Fast payouts</div>
                <button className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white ring-1 ring-white/10 hover:bg-white/15">
                  Open →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HIGH PAYING */}
      <section id="high" className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 md:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold">High paying tasks</h3>
              <p className="mt-2 text-sm text-white/65">Big rewards — limited slots.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {bigPayouts.map((row) => (
              <div
                key={row.name}
                className="flex items-center justify-between rounded-2xl bg-[#070A12]/50 px-4 py-4 ring-1 ring-white/10"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-white/85">{row.name}</div>
                  <div className="mt-1 text-xs text-white/55">Tracks fast • Verified</div>
                </div>
                <div className="ml-4 rounded-2xl bg-white px-4 py-2 text-sm font-extrabold text-black">
                  {row.payout}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CASHOUT */}
      <section id="cashout" className="mx-auto max-w-6xl px-4 py-14">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-500/20 via-white/5 to-fuchsia-500/20 p-6 ring-1 ring-white/10 md:p-10">
          <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative grid gap-6 md:grid-cols-2 md:items-center">
            <div>
              <h4 className="text-2xl font-bold tracking-tight">Cash out when you’re ready</h4>
              <p className="mt-2 text-sm text-white/70">
                Add payout methods (PayPal, gift cards, crypto, etc.) and withdraw fast.
              </p>
              <div className="mt-4 text-xs text-white/60">
                Minimum cashout and methods depend on your region.
              </div>
            </div>

            <div className="rounded-3xl bg-[#070A12]/60 p-4 ring-1 ring-white/10 md:p-5">
              <div className="grid gap-3">
                <button className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90">
                  Add payout method
                </button>
                <button className="inline-flex items-center justify-center rounded-2xl bg-white/5 px-5 py-3 text-sm font-semibold text-white ring-1 ring-white/10 hover:bg-white/10">
                  View withdrawals
                </button>
                <div className="text-center text-xs text-white/55">Secure auth powered by Supabase</div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/55 md:flex-row">
          <div>© {new Date().getFullYear()} Hedimax. All rights reserved.</div>
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
