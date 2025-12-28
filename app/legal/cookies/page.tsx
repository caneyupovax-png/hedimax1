export const metadata = { title: "Cookie Policy | Hedimax" };

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold">Cookie Policy</h1>
        <p className="mt-2 text-white/60 text-sm">Last updated: {new Date().toISOString().slice(0, 10)}</p>

        <section className="mt-8 space-y-4 text-white/80 leading-relaxed">
          <p>
            We use cookies and similar technologies to keep you signed in, secure the service, and understand usage.
          </p>

          <h2 className="text-xl font-semibold text-white">Types of cookies</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><b>Essential:</b> authentication, security.</li>
            <li><b>Analytics:</b> basic usage statistics (if enabled).</li>
          </ul>

          <h2 className="text-xl font-semibold text-white">Managing cookies</h2>
          <p>
            You can control cookies through your browser settings. Disabling essential cookies may break login.
          </p>
        </section>
      </div>
    </main>
  );
}
