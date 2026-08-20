import { getAdminMenuData } from "@/lib/cache/adminData";
import { AdminMenuClient } from "./AdminMenuClient";

export default async function AdminMenuPage() {
  const { categories, menuItems } = await getAdminMenuData();
  return <AdminMenuClient categories={categories} menuItems={menuItems} />;
}
