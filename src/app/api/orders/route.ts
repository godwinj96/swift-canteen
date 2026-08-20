import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { toErrorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/auth/guards";
import { listOrdersForUser, placeOrder } from "@/lib/orders/service";
import { placeOrderSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const user = await requireAuth();
    const orders = await listOrdersForUser(user.sub, user.role);
    return NextResponse.json({ orders });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = placeOrderSchema.parse(await request.json().catch(() => ({})));
    const order = await placeOrder(user.sub, body.pickupTime);
    revalidateTag("orders");
    revalidateTag("admin-orders");
    revalidateTag("admin-dashboard");
    revalidateTag("admin-reports");
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
