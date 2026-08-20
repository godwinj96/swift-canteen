import { getAdminDashboardStats, getRecentOrderActivity } from "@/lib/cache/adminData";
import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const [stats, activity] = await Promise.all([getAdminDashboardStats(), getRecentOrderActivity(8)]);
  return <AdminDashboardClient initialStats={stats} initialActivity={activity} />;
}
