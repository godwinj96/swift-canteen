CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'ADMIN');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'PENDING', 'SUCCESSFUL', 'FAILED');

CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  "fullName" TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  role "Role" NOT NULL DEFAULT 'CUSTOMER',
  phone TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Category" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE "MenuItem" (
  id TEXT PRIMARY KEY,
  "categoryId" TEXT NOT NULL REFERENCES "Category"(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(65,30) NOT NULL,
  "imageUrl" TEXT,
  "isAvailable" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Cart" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CartItem" (
  id TEXT PRIMARY KEY,
  "cartId" TEXT NOT NULL REFERENCES "Cart"(id),
  "itemId" TEXT NOT NULL REFERENCES "MenuItem"(id),
  quantity INTEGER NOT NULL
);

CREATE TABLE "Order" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  status "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "totalAmount" DECIMAL(65,30) NOT NULL,
  "pickupTime" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "OrderItem" (
  id TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL REFERENCES "Order"(id),
  "itemId" TEXT NOT NULL REFERENCES "MenuItem"(id),
  quantity INTEGER NOT NULL,
  "unitPrice" DECIMAL(65,30) NOT NULL
);

CREATE TABLE "Payment" (
  id TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL UNIQUE REFERENCES "Order"(id),
  amount DECIMAL(65,30) NOT NULL,
  reference TEXT NOT NULL UNIQUE,
  status "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
  "paidAt" TIMESTAMP(3)
);

CREATE INDEX "MenuItem_categoryId_idx" ON "MenuItem"("categoryId");
CREATE INDEX "Cart_userId_idx" ON "Cart"("userId");
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");
CREATE INDEX "CartItem_itemId_idx" ON "CartItem"("itemId");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_itemId_idx" ON "OrderItem"("itemId");
