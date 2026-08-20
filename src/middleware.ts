import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { hasMinimumRole } from "@/lib/auth/roles";
import type { Role } from "@prisma/client";

const SESSION_COOKIE_NAME = "session";

const ADMIN_PAGE_PREFIX = "/admin";
const ADMIN_API_PREFIXES = ["/api/dashboard", "/api/admin", "/api/users"];
const CUSTOMER_PAGE_PREFIXES = ["/checkout", "/orders", "/dashboard"];

function getSecretKey(): Uint8Array {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
}

async function readRole(request: NextRequest): Promise<Role | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return (payload.role as Role) ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api");
  const isAdminRoute =
    pathname.startsWith(ADMIN_PAGE_PREFIX) ||
    ADMIN_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isCustomerRoute = CUSTOMER_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isAdminRoute && !isCustomerRoute) {
    return NextResponse.next();
  }

  const role = await readRole(request);

  if (!role) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && !hasMinimumRole(role, "STAFF")) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/dashboard/:path*",
    "/api/dashboard/:path*",
    "/api/admin/:path*",
    "/api/users/:path*",
  ],
};
