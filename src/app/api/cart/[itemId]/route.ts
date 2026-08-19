import { NextRequest, NextResponse } from "next/server";
import { toErrorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/auth/guards";
import { removeCartItem, updateCartItemQuantity } from "@/lib/cart/service";
import { cartUpdateSchema } from "@/lib/validation/schemas";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const user = await requireAuth();
    const { itemId } = await params;
    const body = cartUpdateSchema.parse(await request.json());
    const cart = await updateCartItemQuantity(user.sub, itemId, body.quantity);
    return NextResponse.json({ cart });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const user = await requireAuth();
    const { itemId } = await params;
    const cart = await removeCartItem(user.sub, itemId);
    return NextResponse.json({ cart });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
