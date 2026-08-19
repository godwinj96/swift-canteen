import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/auth/guards";
import { updateOrderStatus } from "@/lib/orders/service";
import { orderStatusUpdateSchema } from "@/lib/validation/schemas";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("STAFF");
    const { id } = await params;
    const body = orderStatusUpdateSchema.parse(await request.json());
    const order = await updateOrderStatus(id, body.status);
    return NextResponse.json({ order });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
