DROP TABLE `shop_settings`;--> statement-breakpoint
DROP INDEX "admin_users_username_unique";--> statement-breakpoint
DROP INDEX "customers_phone_unique";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "sessions_token_unique";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
ALTER TABLE `rental_bills` ALTER COLUMN "tax_type" TO "tax_type" text;--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_username_unique` ON `admin_users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `customers_phone_unique` ON `customers` (`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
ALTER TABLE `rental_bills` DROP COLUMN `tax_percentage`;--> statement-breakpoint
ALTER TABLE `rental_bills` DROP COLUMN `shop_name`;--> statement-breakpoint
ALTER TABLE `rental_bills` DROP COLUMN `shop_address`;--> statement-breakpoint
ALTER TABLE `rental_bills` DROP COLUMN `shop_phone1`;--> statement-breakpoint
ALTER TABLE `rental_bills` DROP COLUMN `shop_phone2`;--> statement-breakpoint
ALTER TABLE `rental_bills` DROP COLUMN `shop_logo_url`;--> statement-breakpoint
ALTER TABLE `rental_bills` DROP COLUMN `shop_qr_url`;--> statement-breakpoint
ALTER TABLE `sales_bills` ALTER COLUMN "tax_type" TO "tax_type" text;--> statement-breakpoint
ALTER TABLE `sales_bills` DROP COLUMN `tax_percentage`;--> statement-breakpoint
ALTER TABLE `sales_bills` DROP COLUMN `shop_name`;--> statement-breakpoint
ALTER TABLE `sales_bills` DROP COLUMN `shop_address`;--> statement-breakpoint
ALTER TABLE `sales_bills` DROP COLUMN `shop_phone1`;--> statement-breakpoint
ALTER TABLE `sales_bills` DROP COLUMN `shop_phone2`;--> statement-breakpoint
ALTER TABLE `sales_bills` DROP COLUMN `shop_logo_url`;--> statement-breakpoint
ALTER TABLE `sales_bills` DROP COLUMN `shop_qr_url`;--> statement-breakpoint
ALTER TABLE `products` DROP COLUMN `product_type`;