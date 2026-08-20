"use client";

import { useRouter } from "next/navigation";
import { setLocalCartOwner } from "@/lib/cart/localCart";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    // Drop back to the shared guest bucket immediately — don't wait for
    // MenuPageClient's identity effect to catch up, in case any cart-reading
    // component is still mounted through the navigation.
    setLocalCartOwner(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="text-left hover:text-canteen">
      Logout
    </button>
  );
}
