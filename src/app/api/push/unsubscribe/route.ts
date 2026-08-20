import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/auth/guards";
import { removeSubscription } from "@/lib/push/service";
import { pushUnsubscribeSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = pushUnsubscribeSchema.parse(await request.json());
    await removeSubscription(body.endpoint);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
