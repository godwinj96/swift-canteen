import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/auth/guards";
import { getAdminReportsData } from "@/lib/cache/adminData";

export async function GET(request: NextRequest) {
  try {
    await requireRole("VENDOR_OWNER");
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");
    const reports = await getAdminReportsData(from, to);
    return NextResponse.json(reports);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
