import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="card-glass p-8 text-center max-w-md w-full">
        <div className="text-2xl font-extrabold">Page not found</div>
        <div className="mt-2 text-white/70 text-sm">
          The page you’re looking for doesn’t exist.
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          <Link className="btn-primary" href="/">
            Go home
          </Link>
          <Link className="btn-ghost" href="/earn">
            Earn
          </Link>
        </div>
      </div>
    </div>
  );
}
