import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/auth/guards";
import { updateProfileSchema } from "@/lib/validation/schemas";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = updateProfileSchema.parse(await request.json());
    const updated = await prisma.user.update({
      where: { id: user.sub },
      data: { fullName: body.fullName, phone: body.phone },
      select: { id: true, fullName: true, email: true, phone: true, role: true },
    });
    return NextResponse.json({ user: updated });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
