import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { hasMinimumRole } from "@/lib/auth/roles";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!hasMinimumRole(user.role, "STAFF")) redirect("/");

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8 sm:py-12 md:flex-row md:gap-8">
      <AdminSidebar role={user.role} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
