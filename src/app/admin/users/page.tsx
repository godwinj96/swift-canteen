import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { AdminUsersClient } from "./AdminUsersClient";

export default async function AdminUsersPage() {
  const [users, currentUser] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    getSessionUser(),
  ]);

  return (
    <AdminUsersClient
      users={users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
      }))}
      currentUserId={currentUser?.sub ?? ""}
      currentUserRole={currentUser?.role ?? "CUSTOMER"}
    />
  );
}
