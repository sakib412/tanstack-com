-- Sample catalogue for the PREVIEW Database. Run with `npx prisma db seed`.
-- Never runs on publish: only prisma/migrations reach the live database.
-- Idempotent: re-running leaves existing products untouched.
INSERT INTO "products" ("slug", "name", "description", "price_cents", "stock", "updated_at") VALUES
  ('community-tee', 'Community Tee', 'Soft 100% cotton t-shirt with the community logo on the chest. Unisex fit.', 2400, 40, now()),
  ('logo-hoodie', 'Logo Hoodie', 'Heavyweight fleece hoodie with a kangaroo pocket and embroidered logo.', 5500, 15, now()),
  ('enamel-mug', 'Enamel Mug', 'A 350 ml enamel camp mug. Dishwasher safe, campfire approved.', 1600, 60, now()),
  ('sticker-pack', 'Sticker Pack', 'Six weatherproof vinyl stickers for your laptop, bottle or bike.', 600, 200, now()),
  ('canvas-tote', 'Canvas Tote', 'Sturdy 12 oz canvas tote with long handles and an inside pocket.', 1800, 25, now()),
  ('dad-cap', 'Dad Cap', 'Washed cotton cap with an adjustable brass buckle.', 2200, 0, now())
ON CONFLICT ("slug") DO NOTHING;
