export const metadata = { title: "Privacy Policy | Hedimax" };

export default function PrivacyPolicyPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
      <p className="mt-2 text-white/60 text-sm">
        Last updated: {new Date().toISOString().slice(0, 10)}
      </p>

      <section className="mt-8 space-y-4 text-white/80 leading-relaxed">
        <p>
          This Privacy Policy explains how Hedimax (“we”, “us”) collects, uses,
          and shares information when you use our website and services.
        </p>

        <h2 className="text-xl font-semibold text-white">
          Information we collect
        </h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><b>Account data:</b> email, username, and authentication identifiers.</li>
          <li><b>Usage data:</b> pages viewed, device/browser info.</li>
          <li><b>Offerwall activity:</b> completion signals to credit rewards.</li>
        </ul>

        <h2 className="text-xl font-semibold text-white">How we use information</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Operate and secure the service.</li>
          <li>Prevent fraud and abuse.</li>
          <li>Improve user experience.</li>
          <li>Comply with legal obligations.</li>
        </ul>

        <h2 className="text-xl font-semibold text-white">Third-party providers</h2>
        <p>
          Offerwall partners (e.g. CPX) process data under their own policies.
          We only receive data required to credit rewards.
        </p>

        <h2 className="text-xl font-semibold text-white">Cookies</h2>
        <p>
          Cookies are used for authentication, security, and basic analytics.
        </p>

        <h2 className="text-xl font-semibold text-white">Contact</h2>
        <p>
          Email: <span className="text-white">support@hedimax.shop</span>
        </p>
      </section>
    </>
  );
}
