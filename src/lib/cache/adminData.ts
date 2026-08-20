import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

// Read-heavy admin aggregates, cached briefly so switching between admin tabs
// doesn't re-run a fresh Postgres round trip on every navigation. Every
// mutation that changes this data calls revalidateTag with the matching tag
// below, so an admin still sees their own action reflected immediately —
// this is a "cheap tab switch," not a stale dashboard.
const REVALIDATE_SECONDS = 20;

export const getAdminDashboardStats = unstable_cache(
  async () => {
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
    return {
      todayOrders,
      pendingOrders,
      todayRevenue: Number(todayRevenue._sum.totalAmount ?? 0),
      totalMenuItems,
    };
  },
  ["admin-dashboard-stats"],
  { revalidate: REVALIDATE_SECONDS, tags: ["admin-dashboard"] }
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
    const [orders, topItems] = await Promise.all([
      prisma.order.findMany({
        where: { status: { not: "CANCELLED" }, ...(from || to ? { createdAt: dateFilter } : {}) },
        select: { totalAmount: true, createdAt: true },
      }),
      prisma.orderItem.groupBy({
        by: ["itemId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }),
    ]);

    const revenueByDay = new Map<string, number>();
    for (const order of orders) {
      const day = order.createdAt.toISOString().slice(0, 10);
      revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + Number(order.totalAmount));
    }

    const itemDetails = await prisma.menuItem.findMany({
      where: { id: { in: topItems.map((t) => t.itemId) } },
      select: { id: true, name: true },
    });
    const nameById = new Map(itemDetails.map((i) => [i.id, i.name]));

    return {
      revenueByDay: Array.from(revenueByDay.entries()).map(([date, revenue]) => ({ date, revenue })),
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
