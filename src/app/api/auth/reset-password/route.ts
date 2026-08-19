import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { toErrorResponse, ApiError } from "@/lib/errors";
import { resetPasswordSchema } from "@/lib/validation/schemas";
import { hashPassword } from "@/lib/auth/password";

export async function POST(request: NextRequest) {
  try {
    const body = resetPasswordSchema.parse(await request.json());
    const tokenHash = crypto.createHash("sha256").update(body.token).digest("hex");

    const user = await prisma.user.findFirst({ where: { resetTokenHash: tokenHash } });
    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      throw new ApiError(400, "This reset link is invalid or has expired");
    }

    const passwordHash = await hashPassword(body.newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
