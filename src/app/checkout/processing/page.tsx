import { getSessionUser } from "@/lib/auth/session";
import { getOrCreateCart } from "@/lib/cart/service";
import { redirect } from "next/navigation";
import { ProcessingClient } from "./ProcessingClient";

// This page exists so "Pay now" on /checkout is a plain, instant client-side
// navigation — no network call blocks the click. The actual order-creation
// and Bachs-checkout-initiation DB/API calls happen here instead, once the
// user is already looking at a page whose whole purpose is "this is in
// progress," rather than making the button itself appear to hang.
export default async function CheckoutProcessingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const cart = await getOrCreateCart(user.sub);
  if (cart.items.length === 0) redirect("/checkout");

  return (
    <ProcessingClient
      items={cart.items.map((ci) => ({
        id: ci.id,
        quantity: ci.quantity,
        item: { id: ci.item.id, name: ci.item.name, price: Number(ci.item.price) },
      }))}
    />
  );
}
