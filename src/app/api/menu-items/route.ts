import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/auth/guards";
import { menuItemCreateSchema } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  try {
    const categoryId = request.nextUrl.searchParams.get("categoryId") ?? undefined;
    const menuItems = await prisma.menuItem.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: { category: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ menuItems });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("VENDOR_OWNER");
    const body = menuItemCreateSchema.parse(await request.json());
    const menuItem = await prisma.menuItem.create({ data: body });
    revalidateTag("admin-menu");
    revalidateTag("public-menu");
    revalidateTag("admin-dashboard");
    return NextResponse.json({ menuItem }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
