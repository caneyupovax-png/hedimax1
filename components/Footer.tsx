import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full relative">
      {/* Daha belirgin üst ayırıcı + soft gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none" />

      <div className="w-full bg-[#05070e]">
        <div className="mx-auto w-full max-w-6xl px-6 lg:px-10 py-7 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* BRAND */}
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Hedimax"
              width={34}
              height={34}
              className="object-contain"
              priority
            />
            <span className="text-lg font-extrabold leading-none">
              <span className="text-emerald-300">HEDI</span>MAX
            </span>
          </div>

          {/* LINKS */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/legal/terms" className="text-white/70 hover:text-white transition">
              Terms
            </Link>
            <Link href="/legal/privacy" className="text-white/70 hover:text-white transition">
              Privacy
            </Link>
            <Link href="/legal/cookies" className="text-white/70 hover:text-white transition">
              Cookies
            </Link>
            <Link href="/legal/contact" className="text-white/70 hover:text-white transition">
              Contact
            </Link>
          </div>
        </div>

        {/* Alt satır (çok hafif ama görünür) */}
        <div className="mx-auto w-full max-w-6xl px-6 lg:px-10 pb-5">
          <div className="h-px w-full bg-white/10" />
          <div className="pt-4 text-center text-xs text-white/55">
            © {new Date().getFullYear()} Hedimax. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
