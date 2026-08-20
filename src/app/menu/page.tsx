import { getSessionUser } from "@/lib/auth/session";
import { getPublicMenuData } from "@/lib/cache/publicData";
import { MenuPageClient } from "./MenuPageClient";

export default async function MenuPage() {
  // getSessionUser reads the auth cookie directly — never cached.
  const [{ categories, items }, user] = await Promise.all([getPublicMenuData(), getSessionUser()]);

  return <MenuPageClient categories={categories} items={items} userId={user?.sub ?? null} />;
}
