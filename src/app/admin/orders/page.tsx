import { getAdminOrdersData } from "@/lib/cache/adminData";
import { AdminOrdersClient } from "./AdminOrdersClient";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrdersData();
  return <AdminOrdersClient orders={orders} />;
}
