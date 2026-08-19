import type { Role } from "@prisma/client";

export const ROLE_RANK: Record<Role, number> = {
  CUSTOMER: 0,
  STAFF: 1,
  VENDOR_OWNER: 2,
  SITE_ADMIN: 3,
  SUPERUSER: 4,
};

export function hasMinimumRole(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}
