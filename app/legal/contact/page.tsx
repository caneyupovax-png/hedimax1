export const metadata = { title: "Contact | Hedimax" };

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold">Contact</h1>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/30 backdrop-blur p-5 text-white/80">
          <p>Support: <span className="text-white">support@hedimax.shop</span></p>
          <p className="mt-2 text-white/60 text-sm">
            Please include your user ID and any offerwall transaction ID when reporting reward issues.
          </p>
        </div>
      </div>
    </main>
  );
}
