import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "./cookies";
import { verifySession, type SessionPayload } from "./jwt";

export async function getSessionUser(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}
