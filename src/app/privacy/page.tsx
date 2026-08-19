export const metadata = {
  title: "Privacy Policy — Swift Canteen",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
      <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">Legal</span>
      <h1 className="font-display mt-2 mb-2 text-4xl tracking-tight text-ink">Privacy Policy</h1>
      <p className="mb-10 text-sm text-muted">Last updated: August 2026</p>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-ink">
        <section>
          <p>
            This policy explains what information Swift Canteen collects, why, and how it&apos;s handled. It
            is written to align with Nigeria&apos;s Data Protection Act (NDPA) 2023.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">1. Information we collect</h2>
          <ul className="list-disc pl-5">
            <li>Account details: full name, email address, phone number (optional), hashed password</li>
            <li>Order history: items ordered, order totals, pickup times, order status</li>
            <li>Payment metadata: transaction references and status from our payment partner (we never see or store your card/bank details)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">2. Why we collect it</h2>
          <ul className="list-disc pl-5">
            <li>To create and manage your account</li>
            <li>To process and fulfill your orders</li>
            <li>To communicate with you about your orders (e.g. status updates, password resets)</li>
            <li>To improve the canteen&apos;s menu and operations</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">3. Who we share it with</h2>
          <p>We share the minimum necessary data with:</p>
          <ul className="list-disc pl-5">
            <li><strong>Bachs</strong> — our payment processor, to process checkout payments</li>
            <li><strong>Supabase</strong> — our database and file storage provider, which hosts your account and order data</li>
            <li><strong>SendLib</strong> — our transactional email provider, to deliver password-reset emails</li>
          </ul>
          <p className="mt-2">We do not sell your personal data to third parties.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">4. Your rights</h2>
          <p>Under the NDPA, you have the right to:</p>
          <ul className="list-disc pl-5">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate information (via your account settings)</li>
            <li>Request deletion of your account and associated data</li>
            <li>Withdraw consent for optional data collection</li>
          </ul>
          <p className="mt-2">Contact the canteen administration to exercise any of these rights.</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">5. Data retention</h2>
          <p>
            We retain account and order data for as long as your account is active, and for a reasonable
            period afterward to meet accounting and legal obligations.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">6. Security</h2>
          <p>
            Passwords are hashed and never stored in plain text. Sessions use httpOnly, secure cookies.
            Access to administrative functions is role-gated.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">7. Contact</h2>
          <p>Questions about this policy or your data? Reach out to the canteen administration directly.</p>
        </section>
      </div>
    </div>
  );
}
