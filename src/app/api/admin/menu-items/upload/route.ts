import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { toErrorResponse, ApiError } from "@/lib/errors";
import { requireRole } from "@/lib/auth/guards";
import { getSupabaseAdmin } from "@/lib/supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    await requireRole("VENDOR_OWNER");

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new ApiError(400, "No file provided");
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new ApiError(400, "Image must be JPEG, PNG, or WebP");
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new ApiError(400, "Image must be under 5MB");
    }

    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${randomUUID()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.storage.from("menu-images").upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (error) throw new ApiError(502, "Could not upload image");

    const { data } = supabaseAdmin.storage.from("menu-images").getPublicUrl(path);
    return NextResponse.json({ imageUrl: data.publicUrl });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}
