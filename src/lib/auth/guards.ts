import type { Role } from "@prisma/client";
import { ApiError } from "@/lib/errors";
import { getSessionUser } from "./session";
import { hasMinimumRole } from "./roles";
import type { SessionPayload } from "./jwt";

export async function requireAuth(): Promise<SessionPayload> {
  const user = await getSessionUser();
  if (!user) {
    throw new ApiError(401, "Authentication required");
  }
  return user;
}

export async function requireRole(minimumRole: Role): Promise<SessionPayload> {
  const user = await requireAuth();
  if (!hasMinimumRole(user.role, minimumRole)) {
    throw new ApiError(403, "Insufficient permissions");
  }
  return user;
}
