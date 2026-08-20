import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Read-heavy admin aggregates, cached briefly so switching between admin tabs
// doesn't re-run a fresh Postgres round trip on every navigation. Every
// mutation that changes this data calls revalidateTag with the matching tag
// below, so an admin still sees their own action reflected immediately —
// this is a "cheap tab switch," not a stale dashboard.
const REVALIDATE_SECONDS = 20;

const TREND_DAYS = 7;

/** Builds the last `days` YYYY-MM-DD keys, oldest first, so a trend series always has one point per day even if an order-free day would otherwise be missing from a DB aggregation. */
function recentDayKeys(days: number): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

export const getAdminDashboardStats = unstable_cache(
  async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const trendStart = new Date();
    trendStart.setHours(0, 0, 0, 0);
    trendStart.setDate(trendStart.getDate() - (TREND_DAYS - 1));

    const [todayOrders, ordersAwaitingAcceptance, pendingOrders, todayRevenue, totalMenuItems, trendOrders] =
      await Promise.all([
        prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING"] } } }),
        prisma.order.aggregate({
          where: { createdAt: { gte: startOfDay }, status: { not: "CANCELLED" } },
          _sum: { totalAmount: true },
        }),
        prisma.menuItem.count({ where: { isAvailable: true } }),
        prisma.order.findMany({
          where: { createdAt: { gte: trendStart }, status: { not: "CANCELLED" } },
          select: { totalAmount: true, createdAt: true },
        }),
      ]);

    const revenueByDay = new Map<string, number>();
    const ordersByDay = new Map<string, number>();
    for (const order of trendOrders) {
      const day = order.createdAt.toISOString().slice(0, 10);
      revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + Number(order.totalAmount));
      ordersByDay.set(day, (ordersByDay.get(day) ?? 0) + 1);
    }
    const revenueTrend = recentDayKeys(TREND_DAYS).map((date) => ({
      date,
      revenue: revenueByDay.get(date) ?? 0,
      orders: ordersByDay.get(date) ?? 0,
    }));

    return {
      todayOrders,
      ordersAwaitingAcceptance,
      pendingOrders,
      todayRevenue: Number(todayRevenue._sum.totalAmount ?? 0),
      totalMenuItems,
      revenueTrend,
    };
  },
  ["admin-dashboard-stats"],
  { revalidate: REVALIDATE_SECONDS, tags: ["admin-dashboard"] }
);

/**
 * Recent-activity feed for the admin home "needs attention / what just
 * happened" panel. No audit-log table exists (out of scope to add for this
 * pass) — approximated from Order.updatedAt, inferring the activity line
 * from the order's current status. Good enough for a glanceable feed; not a
 * substitute for a real event log if that's ever needed.
 */
export const getRecentOrderActivity = unstable_cache(
  async (limit: number) => {
    const orders = await prisma.order.findMany({
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: { id: true, status: true, updatedAt: true, user: { select: { fullName: true } } },
    });
    return orders.map((o) => ({
      orderId: o.id,
      status: o.status,
      customerName: o.user.fullName,
      updatedAt: o.updatedAt.toISOString(),
    }));
  },
  ["admin-recent-activity"],
  { revalidate: REVALIDATE_SECONDS, tags: ["admin-orders", "admin-dashboard"] }
);

export const getAdminMenuData = unstable_cache(
  async () => {
    const [categories, menuItems] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.menuItem.findMany({ orderBy: { createdAt: "desc" }, include: { category: true } }),
    ]);
    return {
      categories: categories.map((c) => ({ id: c.id, name: c.name, description: c.description })),
      menuItems: menuItems.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description,
        price: Number(i.price),
        imageUrl: i.imageUrl,
        isAvailable: i.isAvailable,
        categoryId: i.categoryId,
        categoryName: i.category.name,
      })),
    };
  },
  ["admin-menu-data"],
  { revalidate: REVALIDATE_SECONDS, tags: ["admin-menu"] }
);

export const getAdminOrdersData = unstable_cache(
  async () => {
    const orders = await prisma.order.findMany({
      include: { items: { include: { item: true } }, payment: true, user: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return orders.map((o) => ({
      id: o.id,
      status: o.status,
      totalAmount: Number(o.totalAmount),
      createdAt: o.createdAt.toISOString(),
      customerName: o.user.fullName,
      itemCount: o.items.length,
      items: o.items.map((oi) => ({ name: oi.item.name, quantity: oi.quantity })),
      paymentStatus: o.payment?.status ?? null,
    }));
  },
  ["admin-orders-data"],
  { revalidate: REVALIDATE_SECONDS, tags: ["admin-orders"] }
);

export const getAdminUsersData = unstable_cache(
  async () => {
    const users = await prisma.user.findMany({
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    }));
  },
  ["admin-users-data"],
  { revalidate: REVALIDATE_SECONDS, tags: ["admin-users"] }
);

export const getAdminReportsData = unstable_cache(
  async (from: string | null, to: string | null) => {
    const dateFilter = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
    const orderWhere = { status: { not: "CANCELLED" as const }, ...(from || to ? { createdAt: dateFilter } : {}) };

    const [orders, topItems] = await Promise.all([
      prisma.order.findMany({
        where: orderWhere,
        select: { totalAmount: true, createdAt: true },
      }),
      // Scoped to the same range as everything else on this page — previously
      // ignored from/to entirely and always returned all-time top items,
      // which would have been a confusing mismatch once a visible range
      // selector exists.
      prisma.orderItem.groupBy({
        by: ["itemId"],
        where: { order: orderWhere },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }),
    ]);

    const revenueByDay = new Map<string, number>();
    const ordersByHour = new Map<number, number>();
    for (const order of orders) {
      const day = order.createdAt.toISOString().slice(0, 10);
      revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + Number(order.totalAmount));
      const hour = order.createdAt.getUTCHours();
      ordersByHour.set(hour, (ordersByHour.get(hour) ?? 0) + 1);
    }

    const itemDetails = await prisma.menuItem.findMany({
      where: { id: { in: topItems.map((t) => t.itemId) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(itemDetails.map((i) => [i.id, i.name]));

    return {
      revenueByDay: Array.from(revenueByDay.entries()).map(([date, revenue]) => ({ date, revenue })),
      ordersByHour: Array.from({ length: 24 }, (_, hour) => ({ hour, count: ordersByHour.get(hour) ?? 0 })),
      topItems: topItems.map((t) => ({
        itemId: t.itemId,
        name: nameById.get(t.itemId) ?? "Unknown",
        quantitySold: t._sum.quantity ?? 0,
      })),
      totalRevenue: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
      totalOrders: orders.length,
    };
  },
  ["admin-reports-data"],
  { revalidate: REVALIDATE_SECONDS, tags: ["admin-reports"] }
);
