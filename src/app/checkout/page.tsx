import { getSessionUser } from "@/lib/auth/session";
import { getOrCreateCart } from "@/lib/cart/service";
import { redirect } from "next/navigation";
import { CheckoutClient } from "./CheckoutClient";

export default async function CheckoutPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const cart = await getOrCreateCart(user.sub);

  return (
    <CheckoutClient
      items={cart.items.map((ci) => ({
        id: ci.id,
        quantity: ci.quantity,
        item: { id: ci.item.id, name: ci.item.name, price: Number(ci.item.price) },
      }))}
    />
  );
}
