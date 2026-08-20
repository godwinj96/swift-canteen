import { getAdminDashboardStats } from "@/lib/cache/adminData";
import { AdminDashboardClient } from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();
  return <AdminDashboardClient initialStats={stats} />;
}
