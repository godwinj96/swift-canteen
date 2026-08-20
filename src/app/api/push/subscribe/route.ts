import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/auth/guards";
import { saveSubscription } from "@/lib/push/service";
import { pushSubscribeSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = pushSubscribeSchema.parse(await request.json());
    await saveSubscription(user.sub, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
