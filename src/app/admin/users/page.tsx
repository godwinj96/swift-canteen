import { getSessionUser } from "@/lib/auth/session";
import { getAdminUsersData } from "@/lib/cache/adminData";
import { AdminUsersClient } from "./AdminUsersClient";

export default async function AdminUsersPage() {
  // getSessionUser reads the auth cookie directly — never cached (see adminData.ts).
  const [users, currentUser] = await Promise.all([getAdminUsersData(), getSessionUser()]);

  return (
    <AdminUsersClient
      users={users}
      currentUserId={currentUser?.sub ?? ""}
      currentUserRole={currentUser?.role ?? "CUSTOMER"}
    />
  );
}
