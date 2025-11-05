ALTER TABLE `products` ADD `product_type` text NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `stock_quantity` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `low_stock_threshold` integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `total_sales_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `products` ADD `total_rental_count` integer DEFAULT 0 NOT NULL;