export const metadata = {
  title: "Terms of Service — Swift Canteen",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
      <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">Legal</span>
      <h1 className="font-display mt-2 mb-2 text-4xl tracking-tight text-ink">Terms of Service</h1>
      <p className="mb-10 text-sm text-muted">Last updated: August 2026</p>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-ink">
        <section>
          <h2 className="mb-2 text-lg font-semibold">1. About Swift Canteen</h2>
          <p>
            Swift Canteen is an online ordering platform for campus canteen food and drinks. By creating an
            account or placing an order, you agree to these Terms of Service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">2. Accounts</h2>
          <p>
            You must provide accurate information when registering and are responsible for keeping your login
            credentials secure. You&apos;re responsible for all activity that happens under your account.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">3. Orders and payment</h2>
          <p>
            Orders are confirmed once payment is successfully processed through our payment partner, Bachs.
            Prices are shown in Nigerian Naira (₦) and include all applicable charges at checkout. Once an
            order is confirmed, it moves into preparation and generally cannot be cancelled — contact the
            canteen directly for exceptional circumstances.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">4. Pickup</h2>
          <p>
            Orders are for pickup only. Please collect your order promptly once it&apos;s marked ready — the
            canteen is not responsible for food quality if collection is significantly delayed.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">5. Refunds</h2>
          <p>
            If an item you ordered becomes unavailable or an order cannot be fulfilled, contact the canteen
            for a refund or replacement. Refunds for successfully fulfilled orders are handled case by case.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">6. Acceptable use</h2>
          <p>
            Don&apos;t misuse the platform — this includes attempting to place fraudulent orders, interfering
            with the service, or accessing accounts that aren&apos;t yours.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">7. Changes to these terms</h2>
          <p>
            We may update these terms from time to time. Continued use of Swift Canteen after a change means
            you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold">8. Contact</h2>
          <p>Questions about these terms? Reach out to the canteen administration directly.</p>
        </section>
      </div>
    </div>
  );
}
