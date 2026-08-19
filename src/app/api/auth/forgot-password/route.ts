import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/errors";
import { forgotPasswordSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = forgotPasswordSchema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (user) {
      // TODO: send a real reset email once an email provider is wired up.
      console.log(`Password reset requested for user ${user.id}`);
    }

    // Always respond with success to avoid leaking whether an email is registered.
    return NextResponse.json({ success: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
