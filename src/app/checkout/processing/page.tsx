import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { getPublicMenuData } from "@/lib/cache/publicData";
import { ProcessingClient } from "./ProcessingClient";

// Same cached-catalog approach as /checkout (see the comment there) --
// previously this awaited an uncached getOrCreateCart() DB read before
// "Pay now" could even show the "Placing your order..." state, which
// defeated the point of /checkout/processing existing at all.
export default async function CheckoutProcessingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { items } = await getPublicMenuData();

  return (
    <ProcessingClient
      userId={user.sub}
      catalog={items.map((i) => ({ id: i.id, name: i.name, price: i.price }))}
    />
  );
}
