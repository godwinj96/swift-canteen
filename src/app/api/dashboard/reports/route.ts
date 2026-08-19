import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/auth/guards";

export async function GET(request: NextRequest) {
  try {
    await requireRole("VENDOR_OWNER");

    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");

    const dateFilter = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };

    const orders = await prisma.order.findMany({
      where: {
        status: { not: "CANCELLED" },
        ...(from || to ? { createdAt: dateFilter } : {}),
      },
      select: { totalAmount: true, createdAt: true },
    });

    const revenueByDay = new Map<string, number>();
    for (const order of orders) {
      const day = order.createdAt.toISOString().slice(0, 10);
      revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + Number(order.totalAmount));
    }

    const topItems = await prisma.orderItem.groupBy({
      by: ["itemId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });

    const itemDetails = await prisma.menuItem.findMany({
      where: { id: { in: topItems.map((t) => t.itemId) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(itemDetails.map((i) => [i.id, i.name]));

    return NextResponse.json({
      revenueByDay: Array.from(revenueByDay.entries()).map(([date, revenue]) => ({ date, revenue })),
      topItems: topItems.map((t) => ({
        itemId: t.itemId,
        name: nameById.get(t.itemId) ?? "Unknown",
        quantitySold: t._sum.quantity ?? 0,
      })),
      totalRevenue: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
      totalOrders: orders.length,
    });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
