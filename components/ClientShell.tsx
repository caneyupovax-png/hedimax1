"use client";

import Navbar from "@/components/Navbar";

export default function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />

      <main className="bg-app min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>

      <footer className="border-t border-white/10 bg-black/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-white/70 flex flex-wrap gap-x-6 gap-y-2 justify-center">
          <a href="/legal/privacy" className="hover:text-white">Privacy</a>
          <a href="/legal/terms" className="hover:text-white">Terms</a>
          <a href="/legal/cookies" className="hover:text-white">Cookies</a>
          <a href="/legal/contact" className="hover:text-white">Contact</a>
        </div>
      </footer>
    </>
  );
}
