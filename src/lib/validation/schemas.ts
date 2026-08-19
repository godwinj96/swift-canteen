import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const categoryCreateSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial();

export const menuItemCreateSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(120),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean().optional(),
});

export const menuItemUpdateSchema = menuItemCreateSchema.partial();

export const cartAddSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
});

export const cartUpdateSchema = z.object({
  quantity: z.number().int().min(0),
});

export const placeOrderSchema = z.object({
  pickupTime: z.string().datetime().optional(),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY_FOR_PICKUP",
    "COMPLETED",
    "CANCELLED",
  ]),
});

export const paymentInitiateSchema = z.object({
  orderId: z.string().min(1),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["CUSTOMER", "STAFF", "VENDOR_OWNER", "SITE_ADMIN", "SUPERUSER"]),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().max(20).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});
