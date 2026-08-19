import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/errors";
import { forgotPasswordSchema } from "@/lib/validation/schemas";
import { sendEmail } from "@/lib/email/sendlib";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = forgotPasswordSchema.parse(await request.json());

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetTokenHash: tokenHash,
          resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const appUrl = process.env.APP_URL ?? "http://localhost:3000";
      const resetUrl = `${appUrl}/reset-password?token=${token}`;

      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your Swift Canteen password",
          html: `
            <p>We received a request to reset your Swift Canteen password.</p>
            <p><a href="${resetUrl}">Click here to set a new password</a>. This link expires in 30 minutes.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
          `,
        });
      } catch (emailError) {
        // Don't let an email-provider outage change this endpoint's response shape/timing —
        // that would leak whether the address is registered.
        console.error("Failed to send password reset email", emailError);
      }
    }

    // Always respond with success to avoid leaking whether an email is registered.
    return NextResponse.json({ success: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
