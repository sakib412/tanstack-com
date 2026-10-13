BEGIN;

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'shipped', 'cancelled');

-- CreateTable
CREATE TABLE "orders" (
    "id" SERIAL NOT NULL,
    "customer_name" VARCHAR(120) NOT NULL,
    "item" VARCHAR(200) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "total_cents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
    -- Not expressible in the Prisma schema; the Site API validates the same rules.
    CONSTRAINT "orders_quantity_positive" CHECK ("quantity" > 0),
    CONSTRAINT "orders_unit_price_non_negative" CHECK ("unit_price_cents" >= 0),
    CONSTRAINT "orders_total_matches" CHECK ("total_cents" = "quantity" * "unit_price_cents")
);

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");

COMMIT;
