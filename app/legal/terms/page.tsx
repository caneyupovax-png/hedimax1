export const metadata = { title: "Terms of Service | Hedimax" };

export default function TermsPage() {
  return (
    <>
      <h1 className="text-3xl font-extrabold text-white">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-white/60">
        Last updated: {new Date().toISOString().slice(0, 10)}
      </p>

      <section className="mt-8 space-y-5 text-white/80 leading-relaxed">
        <p>
          By accessing or using Hedimax, you agree to these Terms. If you do not
          agree, do not use the service.
        </p>

        <h2 className="text-xl font-semibold text-white">Eligibility</h2>
        <p>
          You must be at least the minimum age required in your country to use
          offerwall and survey services.
        </p>

        <h2 className="text-xl font-semibold text-white">Rewards & credits</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Rewards are credited only after valid provider confirmation.</li>
          <li>Providers may reverse rewards for fraud or invalid traffic.</li>
          <li>Suspicious activity may result in account suspension.</li>
        </ul>

        <h2 className="text-xl font-semibold text-white">Prohibited activity</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Bots, VPN abuse, or emulator misuse.</li>
          <li>Multiple accounts to exploit rewards.</li>
          <li>Violating provider rules.</li>
        </ul>

        <h2 className="text-xl font-semibold text-white">Withdrawals</h2>
        <p>
          Withdrawals may require verification to prevent fraud.
        </p>

        <h2 className="text-xl font-semibold text-white">Contact</h2>
        <p>
          Email: <span className="text-white">support@hedimax.shop</span>
        </p>
      </section>
    </>
  );
}
