export const metadata = { title: "Contact | Hedimax" };

export default function ContactPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-white">Contact</h1>

      <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur p-5 text-white/80">
        <p>
          Support: <span className="text-white">support@hedimax.shop</span>
        </p>
        <p className="mt-2 text-white/60 text-sm">
          Please include your user ID and any offerwall transaction ID when
          reporting reward issues.
        </p>
      </div>
    </>
  );
}
