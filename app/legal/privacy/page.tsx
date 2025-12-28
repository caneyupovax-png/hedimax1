export const metadata = { title: "Privacy Policy | Hedimax" };

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-white/60 text-sm">Last updated: {new Date().toISOString().slice(0, 10)}</p>

        <section className="mt-8 space-y-4 text-white/80 leading-relaxed">
          <p>
            This Privacy Policy explains how Hedimax (“we”, “us”) collects, uses, and shares information when you use
            our website and services.
          </p>

          <h2 className="text-xl font-semibold text-white">Information we collect</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><b>Account data:</b> email, username, and authentication identifiers.</li>
            <li><b>Usage data:</b> pages viewed, device/browser info, and basic analytics.</li>
            <li><b>Offerwall activity:</b> click and completion signals needed to credit rewards.</li>
          </ul>

          <h2 className="text-xl font-semibold text-white">How we use information</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and operate the service, including reward crediting.</li>
            <li>Prevent fraud and abuse.</li>
            <li>Improve performance and user experience.</li>
            <li>Comply with legal obligations.</li>
          </ul>

          <h2 className="text-xl font-semibold text-white">Third-party offerwall providers</h2>
          <p>
            We integrate third-party offerwall providers (e.g., CPX) to show offers and surveys. These providers may
            process data according to their own privacy policies. We only receive the information necessary to credit
            your account (e.g., transaction id, status, reward amount).
          </p>

          <h2 className="text-xl font-semibold text-white">Cookies</h2>
          <p>
            We use cookies and similar technologies for authentication, security, and basic analytics. You can control
            cookies in your browser settings.
          </p>

          <h2 className="text-xl font-semibold text-white">Data retention</h2>
          <p>
            We keep account and reward records as long as needed to operate the service, comply with law, and prevent
            fraud.
          </p>

          <h2 className="text-xl font-semibold text-white">Your rights</h2>
          <p>
            Depending on your location, you may have rights to access, correct, or delete your personal data. Contact us
            using the information below.
          </p>

          <h2 className="text-xl font-semibold text-white">Contact</h2>
          <p>
            Email: <span className="text-white">support@hedimax.shop</span>
          </p>
        </section>
      </div>
    </main>
  );
}
