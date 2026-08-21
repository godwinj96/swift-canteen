import Link from "next/link";
import { Logomark } from "@/components/ui/Logomark";
import { getSessionUser } from "@/lib/auth/session";
import { hasMinimumRole } from "@/lib/auth/roles";
import { LogoutButton } from "./LogoutButton";
import { PrefetchLink } from "./PrefetchLink";
import { OrdersNavLink } from "./OrdersNavLink";
import { MobileMenuToggle } from "./MobileMenuToggle";
import { CartBadge } from "./CartBadge";

export async function Navbar() {
  const user = await getSessionUser();
  const isAdmin = Boolean(user) && hasMinimumRole(user!.role, "STAFF");

  const renderLinks = (cartVariant: "icon" | "row") => (
    <>
      {user && (
        <Link href="/dashboard" className="text-muted hover:text-canteen">
          Dashboard
        </Link>
      )}
      <PrefetchLink href="/menu" className="hover:text-canteen">
        Menu
      </PrefetchLink>
      {user && <OrdersNavLink />}
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
      {user && <CartBadge userId={user.sub} variant={cartVariant} />}
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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-8 sm:py-7 lg:px-12 xl:px-16">
        <Link href="/" className="flex items-center gap-2.5 font-display text-2xl tracking-tight text-ink">
          <Logomark />
          Swift Canteen
        </Link>
        <nav className="hidden items-center gap-10 text-[15px] font-medium text-ink md:flex">
          {renderLinks("icon")}
        </nav>
        <MobileMenuToggle>{renderLinks("row")}</MobileMenuToggle>
      </div>
    </header>
  );
}
