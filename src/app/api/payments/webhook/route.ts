import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { verifyWebhookSignature, parseWebhookPayload } from "@/lib/payments/bachsClient";
import { reconcilePaymentStatus } from "@/lib/payments/service";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const timestamp = request.headers.get("x-bachs-timestamp");
    const signature = request.headers.get("x-bachs-signature");

    if (!verifyWebhookSignature(rawBody, timestamp, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = parseWebhookPayload(rawBody);
    if (event) {
      await reconcilePaymentStatus(event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
