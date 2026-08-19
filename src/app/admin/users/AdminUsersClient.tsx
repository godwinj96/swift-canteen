"use client";

import { RoleBadge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { hasMinimumRole } from "@/lib/auth/roles";
import { useUsers, useUpdateUserRole, type UserRow } from "@/lib/queries/users";
import type { Role } from "@prisma/client";

const ROLE_OPTIONS: Role[] = ["CUSTOMER", "STAFF", "VENDOR_OWNER", "SITE_ADMIN", "SUPERUSER"];

export function AdminUsersClient({
  users: initialUsers,
  currentUserId,
  currentUserRole,
}: {
  users: UserRow[];
  currentUserId: string;
  currentUserRole: Role;
}) {
  const { data: users = initialUsers } = useUsers(initialUsers);
  const updateRole = useUpdateUserRole();
  const canChangeRoles = hasMinimumRole(currentUserRole, "SUPERUSER");

  return (
    <div>
      <span className="text-[13px] font-semibold tracking-[0.08em] text-canteen uppercase">
        Access control
      </span>
      <h1 className="font-display mt-2 mb-8 text-4xl tracking-tight text-ink">Users</h1>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Email</TableHeaderCell>
            <TableHeaderCell>Role</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.fullName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {canChangeRoles && user.id !== currentUserId ? (
                  <Select
                    value={user.role}
                    onChange={(e) => updateRole.mutate({ userId: user.id, role: e.target.value as Role })}
                    className="w-auto"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <RoleBadge role={user.role} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
