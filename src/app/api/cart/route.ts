import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/auth/guards";
import { addItemToCart, getOrCreateCart, replaceCart } from "@/lib/cart/service";
import { cartAddSchema, cartReplaceSchema } from "@/lib/validation/schemas";

export async function GET() {
  try {
    const user = await requireAuth();
    const cart = await getOrCreateCart(user.sub);
    return NextResponse.json({ cart });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = cartAddSchema.parse(await request.json());
    const cart = await addItemToCart(user.sub, body.itemId, body.quantity);
    return NextResponse.json({ cart }, { status: 201 });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * Bulk-replaces the caller's cart with the given lines. Used to lazily sync a
 * client-owned, localStorage-first cart to the server in the background —
 * see src/lib/cart/useLocalCart.ts — rather than a round trip per interaction.
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = cartReplaceSchema.parse(await request.json());
    await replaceCart(user.sub, body.items);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
