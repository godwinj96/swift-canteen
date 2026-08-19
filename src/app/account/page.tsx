import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AccountClient } from "./AccountClient";

export default async function AccountPage() {
  const session = await getSessionUser();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { fullName: true, email: true, phone: true },
  });
  if (!user) redirect("/login");

  return (
    <AccountClient
      initialFullName={user.fullName}
      email={user.email}
      initialPhone={user.phone ?? ""}
    />
  );
}
