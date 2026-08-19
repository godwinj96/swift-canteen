import Link from "next/link";
import { getSessionUser } from "@/lib/auth/session";
import { hasMinimumRole } from "@/lib/auth/roles";
import { LogoutButton } from "./LogoutButton";
import { PrefetchLink } from "./PrefetchLink";
import { MobileMenuToggle } from "./MobileMenuToggle";

export async function Navbar() {
  const user = await getSessionUser();
  const isAdmin = Boolean(user) && hasMinimumRole(user!.role, "STAFF");

  const links = (
    <>
      <PrefetchLink href="/menu" className="hover:text-canteen">
        Menu
      </PrefetchLink>
      {user && (
        <Link href="/orders" className="text-muted hover:text-canteen">
          My Orders
        </Link>
      )}
      {user && (
        <Link href="/account" className="text-muted hover:text-canteen">
          Account
        </Link>
      )}
      {isAdmin && (
        <Link href="/admin" className="text-muted hover:text-canteen">
          Admin
        </Link>
      )}
      {user ? (
        <LogoutButton />
      ) : (
        <>
          <Link href="/login" className="text-muted hover:text-canteen">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-ink px-6 py-2.5 font-semibold text-white hover:bg-canteen-dark"
          >
            Sign up
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="relative bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8 sm:py-7">
        <Link href="/" className="font-display text-2xl tracking-tight text-ink">
          Swift Canteen
        </Link>
        <nav className="hidden items-center gap-10 text-[15px] font-medium text-ink md:flex">{links}</nav>
        <MobileMenuToggle>{links}</MobileMenuToggle>
      </div>
    </header>
  );
}
