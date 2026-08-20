import { NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/auth/guards";
import { getRecentOrderActivity } from "@/lib/cache/adminData";

export async function GET() {
  try {
    await requireRole("VENDOR_OWNER");
    const activity = await getRecentOrderActivity(8);
    return NextResponse.json({ activity });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
