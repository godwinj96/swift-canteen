import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/auth/guards";
import { addItemToCart, getOrCreateCart } from "@/lib/cart/service";
import { cartAddSchema } from "@/lib/validation/schemas";

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
