CREATE TABLE `shop_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`shop_name` text NOT NULL,
	`shop_address` text,
	`phone_number_1` text,
	`phone_number_2` text,
	`logo_url` text,
	`payment_qr_url` text,
	`language` text DEFAULT 'english' NOT NULL,
	`theme` text DEFAULT 'light' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
