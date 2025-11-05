CREATE TABLE `calendar_bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`booking_date` text NOT NULL,
	`bill_type` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`notes` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`address` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_phone_unique` ON `customers` (`phone`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`rate` real NOT NULL,
	`category` text,
	`product_type` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rental_bills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`serial_no` integer NOT NULL,
	`from_date` text NOT NULL,
	`to_date` text,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_address` text,
	`items` text NOT NULL,
	`subtotal` real NOT NULL,
	`transport_fees` real NOT NULL,
	`tax_percentage` real NOT NULL,
	`tax_amount` real NOT NULL,
	`tax_type` text NOT NULL,
	`advance_amount` real NOT NULL,
	`total_amount` real NOT NULL,
	`is_paid` integer NOT NULL,
	`customer_feedback` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sales_bills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`serial_no` integer NOT NULL,
	`bill_date` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text NOT NULL,
	`customer_address` text,
	`items` text NOT NULL,
	`subtotal` real NOT NULL,
	`tax_percentage` real NOT NULL,
	`tax_amount` real NOT NULL,
	`tax_type` text NOT NULL,
	`advance_amount` real NOT NULL,
	`total_amount` real NOT NULL,
	`is_paid` integer NOT NULL,
	`customer_feedback` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
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
