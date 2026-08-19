import type { OrderStatus, PaymentStatus, Role } from "@prisma/client";

const ORDER_STATUS_CLASSES: Record<OrderStatus, string> = {
  PENDING: "bg-stone-100 text-stone-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PREPARING: "bg-amber-100 text-amber-700",
  READY_FOR_PICKUP: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const PAYMENT_STATUS_CLASSES: Record<PaymentStatus, string> = {
  INITIATED: "bg-stone-100 text-stone-700",
  PENDING: "bg-amber-100 text-amber-700",
  SUCCESSFUL: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
};

const ROLE_CLASSES: Record<Role, string> = {
  CUSTOMER: "bg-stone-100 text-stone-700",
  STAFF: "bg-blue-100 text-blue-700",
  VENDOR_OWNER: "bg-amber-100 text-amber-700",
  SITE_ADMIN: "bg-purple-100 text-purple-700",
  SUPERUSER: "bg-canteen-light text-canteen-dark",
};

function BadgeBase({ className, label }: { className: string; label: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label.replace(/_/g, " ")}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <BadgeBase className={ORDER_STATUS_CLASSES[status]} label={status} />;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <BadgeBase className={PAYMENT_STATUS_CLASSES[status]} label={status} />;
}

export function RoleBadge({ role }: { role: Role }) {
  return <BadgeBase className={ROLE_CLASSES[role]} label={role} />;
}
