import { getAdminReportsData } from "@/lib/cache/adminData";
import { AdminReportsClient } from "./AdminReportsClient";

export default async function AdminReportsPage() {
  const reports = await getAdminReportsData(null, null);
  return <AdminReportsClient initialReports={reports} />;
}
