-- Migrate existing ADMIN rows to SUPERUSER, then drop the ADMIN enum value
UPDATE "User" SET role = 'SUPERUSER' WHERE role = 'ADMIN';

ALTER TYPE "Role" RENAME TO "Role_old";
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'STAFF', 'VENDOR_OWNER', 'SITE_ADMIN', 'SUPERUSER');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING role::text::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'CUSTOMER';
DROP TYPE "Role_old";
