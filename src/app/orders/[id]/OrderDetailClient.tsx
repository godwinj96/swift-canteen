"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatNaira } from "@/lib/currency";
import { useOrderDetail, useRetryPayment, type OrderDetail } from "@/lib/queries/orderDetail";
import { EnableNotificationsPrompt } from "@/components/notifications/EnableNotificationsPrompt";

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP", "COMPLETED"] as const;

function ReturnFromCheckoutBanner({ onReturned }: { onReturned: () => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      onReturned();
      router.replace(window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}

export function OrderDetailClient({ initialOrder }: { initialOrder: OrderDetail }) {
  const { data: order = initialOrder } = useOrderDetail(initialOrder.id, initialOrder);
  const retryPayment = useRetryPayment(order.id);
  const [returnedFromCheckout, setReturnedFromCheckout] = useState(false);

  const currentStepIndex = STATUS_STEPS.indexOf(order.status as (typeof STATUS_STEPS)[number]);
  const canRetryPayment = order.payment && (order.payment.status === "FAILED" || order.payment.status === "INITIATED");
  const paymentStatus = order.payment?.status;

  // Bachs redirects to success_url once the hosted checkout completes, before
  // the async webhook has actually settled the payment — so a "success"
  // redirect only means "confirming," not "confirmed." The banner has to
  // track the real, polled payment status rather than assert success from
  // the redirect alone, or it can keep claiming success after a payment that
  // the webhook later marks FAILED (e.g. underpayment, signature mismatch).
  useEffect(() => {
    if (returnedFromCheckout && paymentStatus === "SUCCESSFUL") {
      toast.success("Payment received — your order is being confirmed.");
    }
  }, [returnedFromCheckout, paymentStatus]);

  async function handleRetryPayment() {
    try {
      const result = await retryPayment.mutateAsync();
      window.location.href = result.checkoutUrl;
    } catch {
      // surfaced via the global mutation error toast
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-8">
      <Suspense fallback={null}>
        <ReturnFromCheckoutBanner onReturned={() => setReturnedFromCheckout(true)} />
      </Suspense>

      {returnedFromCheckout && paymentStatus === "SUCCESSFUL" && (
        <Card className="mb-6 border border-emerald-200 bg-emerald-50">
          <p className="text-sm font-semibold text-emerald-800">Order confirmed 🎉</p>
          <p className="mt-1 text-sm text-emerald-700">
            Your payment went through and the canteen has your order. We&apos;ll update the status below as it&apos;s
            prepared.
          </p>
          <EnableNotificationsPrompt />
        </Card>
      )}

      {returnedFromCheckout && (paymentStatus === "INITIATED" || paymentStatus === "PENDING") && (
        <Card className="mb-6 border border-line bg-canteen-light">
          <p className="text-sm font-semibold text-ink">Confirming your payment…</p>
          <p className="mt-1 text-sm text-muted">
            This usually takes a few seconds. This page updates automatically — no need to refresh.
          </p>
        </Card>
      )}

      {returnedFromCheckout && paymentStatus === "FAILED" && (
        <Card className="mb-6 border border-red-200 bg-red-50">
          <p className="text-sm font-semibold text-red-800">We couldn&apos;t confirm that payment</p>
          <p className="mt-1 text-sm text-red-700">
            Your card or transfer wasn&apos;t successfully charged, so this order hasn&apos;t been paid for yet. You can
            retry below — you won&apos;t be charged twice.
          </p>
        </Card>
      )}

      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl tracking-tight text-ink">Order #{order.id.slice(-8)}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.status !== "CANCELLED" && (
        <div className="mb-8 flex items-center justify-between">
          {STATUS_STEPS.map((step, idx) => (
            <div key={step} className="flex flex-1 flex-col items-center text-center">
              <div
                className={`mb-1 h-3 w-3 rounded-full ${
                  idx <= currentStepIndex ? "bg-canteen" : "bg-line"
                }`}
              />
              <span className="text-[10px] text-muted">{step.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      )}

      <Card className="mb-4">
        <h2 className="mb-3 font-semibold text-ink">Items</h2>
        <ul className="flex flex-col gap-2 text-sm text-ink">
          {order.items.map((oi) => (
            <li key={oi.id} className="flex justify-between">
              <span>
                {oi.quantity}× {oi.item.name}
              </span>
              <span>{formatNaira(oi.unitPrice * oi.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-line pt-4 font-semibold text-ink">
          <span>Total</span>
          <span>{formatNaira(order.totalAmount)}</span>
        </div>
      </Card>

      {order.payment && (
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Payment status</span>
            <PaymentStatusBadge status={order.payment.status} />
          </div>
          {order.payment.status === "INITIATED" && (
            <p className="mt-3 text-xs text-muted">
              Waiting for payment confirmation. This page updates automatically — no need to refresh.
            </p>
          )}
          {canRetryPayment && (
            <Button
              onClick={handleRetryPayment}
              disabled={retryPayment.isPending}
              className="mt-4 w-full"
            >
              {retryPayment.isPending
                ? "Redirecting..."
                : order.payment.status === "FAILED"
                  ? "Retry payment"
                  : "Complete payment"}
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
