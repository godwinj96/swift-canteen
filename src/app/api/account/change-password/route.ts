import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toErrorResponse, ApiError } from "@/lib/errors";
import { requireAuth } from "@/lib/auth/guards";
import { changePasswordSchema } from "@/lib/validation/schemas";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = changePasswordSchema.parse(await request.json());

    const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
    if (!dbUser) throw new ApiError(404, "User not found");

    const isValid = await verifyPassword(body.currentPassword, dbUser.passwordHash);
    if (!isValid) throw new ApiError(400, "Current password is incorrect");

    const passwordHash = await hashPassword(body.newPassword);
    await prisma.user.update({ where: { id: user.sub }, data: { passwordHash } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
