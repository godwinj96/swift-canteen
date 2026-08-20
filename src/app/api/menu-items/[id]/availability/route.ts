import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/auth/guards";

const availabilitySchema = z.object({ isAvailable: z.boolean() });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("STAFF");
    const { id } = await params;
    const body = availabilitySchema.parse(await request.json());
    const menuItem = await prisma.menuItem.update({ where: { id }, data: body });
    revalidateTag("admin-menu");
    revalidateTag("public-menu");
    revalidateTag("admin-dashboard");
    return NextResponse.json({ menuItem });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
