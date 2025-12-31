import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="
        border-t border-white/10
        bg-[#070a0f]
      "
    >
      <div
        className="
          mx-auto max-w-6xl
          px-6 py-4
          flex flex-col sm:flex-row
          items-center justify-between
          gap-4
          text-sm text-white/60
        "
      >
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
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/legal/terms" className="hover:text-white transition">
            Terms
          </Link>
          <Link href="/legal/privacy" className="hover:text-white transition">
            Privacy
          </Link>
          <Link href="/legal/cookies" className="hover:text-white transition">
            Cookies
          </Link>
          <Link href="/legal/contact" className="hover:text-white transition">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
