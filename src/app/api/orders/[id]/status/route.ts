import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import { toErrorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/auth/guards";
import { updateOrderStatus } from "@/lib/orders/service";
import { orderStatusUpdateSchema } from "@/lib/validation/schemas";
import { sendPushToUser } from "@/lib/push/service";

// CANCELLED is deliberately excluded — a cancellation is already surfaced by
// the order page's live-polling status badge, and a push about a cancelled
// order reads as bad news best not pushed to a lock screen.
const STATUS_NOTIFICATIONS: Partial<Record<OrderStatus, { title: string; body: string }>> = {
  CONFIRMED: { title: "Order confirmed", body: "The canteen has accepted your order." },
  PREPARING: { title: "Order in the kitchen", body: "Your order is being prepared." },
  READY_FOR_PICKUP: { title: "Order ready! 🎉", body: "Come grab it — your order is ready for pickup." },
  COMPLETED: { title: "Order completed", body: "Thanks for ordering with Swift Canteen!" },
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("STAFF");
    const { id } = await params;
    const body = orderStatusUpdateSchema.parse(await request.json());
    const order = await updateOrderStatus(id, body.status);
    revalidateTag("orders");
    revalidateTag("admin-orders");
    revalidateTag("admin-dashboard");
    revalidateTag("admin-reports");

    const notification = STATUS_NOTIFICATIONS[order.status];
    if (notification) {
      await sendPushToUser(order.userId, { ...notification, url: `/orders/${order.id}` });
    }

    return NextResponse.json({ order });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
