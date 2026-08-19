ALTER TABLE "Payment" ADD COLUMN "providerCheckoutUrl" TEXT;
ALTER TABLE "Payment" ADD COLUMN "providerCheckoutExpires" TIMESTAMP(3);
