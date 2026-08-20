import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/auth/guards";
import { categoryCreateSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { items: true },
    });
    return NextResponse.json({ categories });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole("VENDOR_OWNER");
    const body = categoryCreateSchema.parse(await request.json());
    const category = await prisma.category.create({ data: body });
    revalidateTag("admin-menu");
    revalidateTag("public-menu");
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
