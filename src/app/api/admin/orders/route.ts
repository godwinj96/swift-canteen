import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/auth/guards";
import { listOrdersForUser } from "@/lib/orders/service";

export async function GET() {
  try {
    const user = await requireRole("STAFF");
    const orders = await listOrdersForUser(user.sub, user.role);
    return NextResponse.json({ orders });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
