"use client";

import AppShell from "@/components/AppShell";
import Link from "next/link";
// import useUser from "@/lib/useUser"; // sende neyse onu kullan

export default function DashboardPage() {
  // örnek:
  // const { user, loading } = useUser();

  const loading = false; // TEMP: test için
  const user = { id: "1" }; // TEMP: test için

  return (
    <AppShell title="Your overview">
      {loading ? (
        <div className="card-glass p-5 text-white/70">Loading...</div>
      ) : !user ? (
        <div className="card-glass p-5">
          <div className="text-white font-semibold">Please sign in</div>
          <div className="mt-2 text-white/60 text-sm">
            You need an account to view your dashboard.
          </div>
          <div className="mt-4">
            <Link className="btn-primary" href="/login">Go to Login</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card-glass p-5 md:col-span-2">
              <div className="text-white/60 text-sm">Balance</div>
              <div className="mt-2 text-3xl font-bold text-white">0 coin</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link className="btn-primary" href="/earn">Start earning</Link>
                <Link className="btn-ghost" href="/cashout">Cash out</Link>
              </div>
            </div>

            <div className="card-glass p-5">
              <div className="text-white font-semibold">Rate</div>
              <div className="mt-2 text-white/80 text-sm">
                1 USD = <span className="text-white font-semibold">1000 coin</span>
              </div>
              <div className="mt-3 text-white/60 text-sm">
                Coins are added automatically after completion via postback.
              </div>
            </div>
          </div>

          <div className="mt-4 card-glass p-5">
            <div className="text-white font-semibold">Recent activity</div>
            <div className="mt-3 text-white/60 text-sm">No activity yet.</div>
          </div>
        </>
      )}
    </AppShell>
  );
}
