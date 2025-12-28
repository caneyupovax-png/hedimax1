export const metadata = { title: "Terms of Service | Hedimax" };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-white/60 text-sm">Last updated: {new Date().toISOString().slice(0, 10)}</p>

        <section className="mt-8 space-y-4 text-white/80 leading-relaxed">
          <p>
            By accessing or using Hedimax, you agree to these Terms. If you do not agree, do not use the service.
          </p>

          <h2 className="text-xl font-semibold text-white">Eligibility</h2>
          <p>
            You must be at least the minimum age required in your country to use offerwall/survey services.
          </p>

          <h2 className="text-xl font-semibold text-white">Rewards & credits</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Rewards are credited only after we receive a valid postback/confirmation from the provider.</li>
            <li>Providers may reverse/deny rewards for fraud, chargebacks, invalid traffic, or incomplete offers.</li>
            <li>We may suspend accounts involved in suspicious activity.</li>
          </ul>

          <h2 className="text-xl font-semibold text-white">Prohibited activity</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Using bots, VPN/proxy abuse, emulator abuse (if not allowed), or manipulating offers.</li>
            <li>Creating multiple accounts to exploit rewards.</li>
            <li>Any activity that violates provider rules.</li>
          </ul>

          <h2 className="text-xl font-semibold text-white">Withdrawals</h2>
          <p>
            Withdrawals are subject to verification and may require additional checks to prevent fraud.
          </p>

          <h2 className="text-xl font-semibold text-white">Disclaimer</h2>
          <p>
            The service is provided “as is” without warranties. We are not responsible for third-party offer content.
          </p>

          <h2 className="text-xl font-semibold text-white">Contact</h2>
          <p>Email: <span className="text-white">support@hedimax.shop</span></p>
        </section>
      </div>
    </main>
  );
}
