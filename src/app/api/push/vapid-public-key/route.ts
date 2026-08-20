import { NextResponse } from "next/server";

// Public by design — the VAPID public key is meant to be handed to the
// browser's Push API and carries no secret; the private key never leaves
// src/lib/push/service.ts. Avoids introducing a NEXT_PUBLIC_* env var into a
// codebase where every existing env var is server-only.
export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return NextResponse.json({ error: "Push notifications are not configured" }, { status: 503 });
  }
  return NextResponse.json({ publicKey });
}
