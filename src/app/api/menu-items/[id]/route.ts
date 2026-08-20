import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/auth/guards";
import { menuItemUpdateSchema } from "@/lib/validation/schemas";

function revalidateMenuTags() {
  revalidateTag("admin-menu");
  revalidateTag("public-menu");
  revalidateTag("admin-dashboard");
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("VENDOR_OWNER");
    const { id } = await params;
    const body = menuItemUpdateSchema.parse(await request.json());
    const menuItem = await prisma.menuItem.update({ where: { id }, data: body });
    revalidateMenuTags();
    return NextResponse.json({ menuItem });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("VENDOR_OWNER");
    const { id } = await params;
    await prisma.menuItem.delete({ where: { id } });
    revalidateMenuTags();
    return NextResponse.json({ success: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
