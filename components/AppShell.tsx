import Link from "next/link";

export default function AppShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="bg-app min-h-screen">
      <header className="nav-glass">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-white/10 border border-white/10" />
            <div className="text-white font-semibold tracking-wide">Hedimax</div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link className="btn-ghost" href="/earn">Earn</Link>
            <Link className="btn-ghost" href="/cashout">Cashout</Link>
          </nav>
        </div>

        {title ? (
          <div className="mx-auto max-w-6xl px-6 pb-4">
            <div className="text-white/70 text-sm">{title}</div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
