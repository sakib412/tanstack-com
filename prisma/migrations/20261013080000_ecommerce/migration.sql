BEGIN;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "address_line1" VARCHAR(200),
ADD COLUMN     "address_line2" VARCHAR(200),
ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "country" VARCHAR(80),
ADD COLUMN     "note" VARCHAR(500),
ADD COLUMN     "phone" VARCHAR(40),
ADD COLUMN     "postal_code" VARCHAR(20),
ADD COLUMN     "public_id" UUID NOT NULL DEFAULT gen_random_uuid(),
ALTER COLUMN "item" DROP NOT NULL,
ALTER COLUMN "quantity" DROP NOT NULL,
ALTER COLUMN "unit_price_cents" DROP NOT NULL;

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "price_cents" INTEGER NOT NULL,
    "image_url" VARCHAR(500),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id"),
    -- Not expressible in the Prisma schema; the Site API validates the same rules.
    CONSTRAINT "products_price_non_negative" CHECK ("price_cents" >= 0),
    CONSTRAINT "products_stock_non_negative" CHECK ("stock" >= 0)
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "product_id" INTEGER,
    "name" VARCHAR(200) NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_total_cents" INTEGER NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" > 0),
    CONSTRAINT "order_items_unit_price_non_negative" CHECK ("unit_price_cents" >= 0),
    CONSTRAINT "order_items_line_total_matches" CHECK ("line_total_cents" = "quantity" * "unit_price_cents")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_active_created_at_idx" ON "products"("active", "created_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_public_id_key" ON "orders"("public_id");

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
