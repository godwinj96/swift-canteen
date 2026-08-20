import { getAdminReportsData } from "@/lib/cache/adminData";
import { boundsForRange, DEFAULT_ANALYTICS_RANGE } from "@/lib/dateRanges";
import { AdminReportsClient } from "./AdminReportsClient";

export default async function AdminReportsPage() {
  const { from, to } = boundsForRange(DEFAULT_ANALYTICS_RANGE);
  const reports = await getAdminReportsData(from, to);
  return <AdminReportsClient initialReports={reports} />;
}
