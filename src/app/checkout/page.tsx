import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getPublicMenuData } from "@/lib/cache/publicData";
import { CheckoutClient } from "./CheckoutClient";

// Deliberately reads the cached menu catalog (unstable_cache, ~free on a
// cache hit) instead of the live Cart table -- the previous version awaited
// an uncached getOrCreateCart() DB round trip on every /checkout load, which
// stacked on top of the "Checkout" button's own blocking sync and made the
// whole flow feel sluggish. CheckoutClient reads cart lines straight out of
// localStorage (see useLocalCart), so this page only needs id/name/price to
// resolve those lines to display data.
export default async function CheckoutPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { items } = await getPublicMenuData();

  return (
    <CheckoutClient
      userId={user.sub}
      catalog={items.map((i) => ({ id: i.id, name: i.name, price: i.price }))}
    />
  );
}
