import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/auth/guards";
import { initiatePayment } from "@/lib/payments/service";
import { paymentInitiateSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = paymentInitiateSchema.parse(await request.json());
    const result = await initiatePayment(body.orderId, user.sub, user.email);
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
