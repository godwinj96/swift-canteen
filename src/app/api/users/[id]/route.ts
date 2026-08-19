import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toErrorResponse, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth/guards";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("SITE_ADMIN");
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, fullName: true, email: true, role: true, phone: true, createdAt: true },
    });
    if (!user) throw new ApiError(404, "User not found");
    return NextResponse.json({ user });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
