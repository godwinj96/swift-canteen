import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toErrorResponse, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth/guards";
import { updateUserRoleSchema } from "@/lib/validation/schemas";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireRole("SUPERUSER");
    const { id } = await params;
    if (id === actor.sub) {
      throw new ApiError(400, "You cannot change your own role");
    }
    const body = updateUserRoleSchema.parse(await request.json());
    const user = await prisma.user.update({
      where: { id },
      data: { role: body.role },
      select: { id: true, fullName: true, email: true, role: true, phone: true, createdAt: true },
    });
    return NextResponse.json({ user });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
