import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/errors";
import { requireRole } from "@/lib/auth/guards";

export async function GET() {
  try {
    await requireRole("VENDOR_OWNER");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [todayOrders, pendingOrders, todayRevenue, totalMenuItems] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING"] } } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: startOfDay }, status: { not: "CANCELLED" } },
        _sum: { totalAmount: true },
      }),
      prisma.menuItem.count({ where: { isAvailable: true } }),
    ]);

    return NextResponse.json({
      todayOrders,
      pendingOrders,
      todayRevenue: todayRevenue._sum.totalAmount ?? 0,
      totalMenuItems,
    });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
