CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text,
	`upload_id` text,
	`sku_snapshot` text NOT NULL,
	`name_snapshot` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_price_cents` integer NOT NULL,
	`line_total_cents` integer NOT NULL,
	`personalization_json` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`upload_id`) REFERENCES `uploads`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "order_items_quantity_positive" CHECK("order_items"."quantity" > 0),
	CONSTRAINT "order_items_amounts_nonnegative" CHECK("order_items"."unit_price_cents" >= 0 AND "order_items"."line_total_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_order_items_order_id` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_order_items_product_id` ON `order_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `order_status_history` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`status` text NOT NULL,
	`note` text,
	`actor` text DEFAULT 'system' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_order_status_history_order_created` ON `order_status_history` (`order_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`order_number` text NOT NULL,
	`public_token` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`customer_email` text NOT NULL,
	`customer_name` text NOT NULL,
	`customer_phone` text,
	`status` text DEFAULT 'awaiting_payment' NOT NULL,
	`payment_status` text DEFAULT 'unpaid' NOT NULL,
	`payment_provider` text,
	`payment_reference` text,
	`fulfillment_method` text NOT NULL,
	`shipping_address_json` text,
	`customer_notes` text,
	`currency` text DEFAULT 'USD' NOT NULL,
	`subtotal_cents` integer NOT NULL,
	`shipping_cents` integer DEFAULT 0 NOT NULL,
	`tax_cents` integer DEFAULT 0 NOT NULL,
	`discount_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "orders_fulfillment_allowed" CHECK("orders"."fulfillment_method" IN ('pickup', 'shipping')),
	CONSTRAINT "orders_amounts_nonnegative" CHECK("orders"."subtotal_cents" >= 0 AND "orders"."shipping_cents" >= 0 AND "orders"."tax_cents" >= 0 AND "orders"."discount_cents" >= 0 AND "orders"."total_cents" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_orders_order_number_unique` ON `orders` (`order_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_orders_public_token_unique` ON `orders` (`public_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_orders_idempotency_key_unique` ON `orders` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `idx_orders_customer_created` ON `orders` (`customer_email`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_orders_status_created` ON `orders` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`sku` text NOT NULL,
	`name` text NOT NULL,
	`short_description` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`product_type` text DEFAULT 'made_to_order' NOT NULL,
	`base_price_cents` integer NOT NULL,
	`compare_at_price_cents` integer,
	`currency` text DEFAULT 'USD' NOT NULL,
	`material` text DEFAULT 'PLA' NOT NULL,
	`image_url` text,
	`gallery_json` text DEFAULT '[]' NOT NULL,
	`personalization_schema_json` text DEFAULT '[]' NOT NULL,
	`attributes_json` text DEFAULT '{}' NOT NULL,
	`lead_time_min_days` integer DEFAULT 2 NOT NULL,
	`lead_time_max_days` integer DEFAULT 5 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`is_featured` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "products_base_price_nonnegative" CHECK("products"."base_price_cents" >= 0),
	CONSTRAINT "products_lead_time_valid" CHECK("products"."lead_time_min_days" >= 0 AND "products"."lead_time_max_days" >= "products"."lead_time_min_days")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_products_slug_unique` ON `products` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE INDEX `idx_products_active_category_sort` ON `products` (`is_active`,`category`,`sort_order`);--> statement-breakpoint
CREATE INDEX `idx_products_active_featured_sort` ON `products` (`is_active`,`is_featured`,`sort_order`);--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`upload_id` text NOT NULL,
	`order_id` text,
	`status` text DEFAULT 'pending_review' NOT NULL,
	`material` text DEFAULT 'PLA' NOT NULL,
	`color` text,
	`quality` text DEFAULT 'standard' NOT NULL,
	`infill_percent` integer DEFAULT 20 NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`estimated_mass_grams` real,
	`estimated_print_minutes` integer,
	`quoted_price_cents` integer,
	`currency` text DEFAULT 'USD' NOT NULL,
	`pricing_breakdown_json` text,
	`expires_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`upload_id`) REFERENCES `uploads`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "quotes_request_values_valid" CHECK("quotes"."infill_percent" BETWEEN 0 AND 100 AND "quotes"."quantity" BETWEEN 1 AND 100),
	CONSTRAINT "quotes_price_nonnegative" CHECK("quotes"."quoted_price_cents" IS NULL OR "quotes"."quoted_price_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `idx_quotes_upload_created` ON `quotes` (`upload_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_quotes_status_created` ON `quotes` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`access_token_hash` text NOT NULL,
	`original_filename` text NOT NULL,
	`format` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`sha256` text NOT NULL,
	`status` text DEFAULT 'received' NOT NULL,
	`customer_email` text,
	`client_estimates_json` text DEFAULT '{}' NOT NULL,
	`rejection_reason` text,
	`expires_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "uploads_byte_size_positive" CHECK("uploads"."byte_size" > 0),
	CONSTRAINT "uploads_format_allowed" CHECK("uploads"."format" IN ('stl', 'obj', '3mf'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_uploads_object_key_unique` ON `uploads` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_uploads_status_created` ON `uploads` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_uploads_customer_created` ON `uploads` (`customer_email`,`created_at`);--> statement-breakpoint
CREATE TABLE `waitlist_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`feature` text DEFAULT 'ai-scan' NOT NULL,
	`city` text,
	`phone_type` text,
	`intended_object` text,
	`marketing_consent` integer DEFAULT false NOT NULL,
	`source` text DEFAULT 'website' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_waitlist_email_feature_unique` ON `waitlist_entries` (`email`,`feature`);--> statement-breakpoint
CREATE INDEX `idx_waitlist_feature_created` ON `waitlist_entries` (`feature`,`created_at`);--> statement-breakpoint
INSERT OR IGNORE INTO `products` (
	`id`, `slug`, `sku`, `name`, `short_description`, `description`, `category`,
	`product_type`, `base_price_cents`, `compare_at_price_cents`, `currency`,
	`material`, `personalization_schema_json`, `attributes_json`,
	`lead_time_min_days`, `lead_time_max_days`, `is_active`, `is_featured`, `sort_order`
) VALUES (
	'prod_desk_name', 'personalized-desk-name-sign', 'BL-NAME-001',
	'Personalized Desk Name Sign', 'A clean two-color nameplate made for desks, studios, and gifts.',
	'Choose the name and color pairing for a locally printed desk sign with crisp raised lettering.',
	'personalized-gifts', 'personalized', 2499, 2999, 'USD', 'PLA',
	'[{"key":"name","label":"Name","type":"text","required":true,"maxLength":24},{"key":"primaryColor","label":"Base color","type":"color","required":true},{"key":"accentColor","label":"Letter color","type":"color","required":true}]',
	'{"dimensions":"8 × 2 in","finish":"matte","localPickup":true}', 2, 4, 1, 1, 10
);--> statement-breakpoint
INSERT OR IGNORE INTO `products` (
	`id`, `slug`, `sku`, `name`, `short_description`, `description`, `category`,
	`product_type`, `base_price_cents`, `currency`, `material`,
	`personalization_schema_json`, `attributes_json`, `lead_time_min_days`,
	`lead_time_max_days`, `is_active`, `is_featured`, `sort_order`
) VALUES (
	'prod_qr_stand', 'custom-qr-code-counter-stand', 'BL-QR-001',
	'Custom QR Code Counter Stand', 'A branded scan-ready counter sign for menus, reviews, or payments.',
	'Send your destination URL and brand colors. We create a durable, easy-to-scan QR stand for your counter.',
	'business', 'personalized', 3499, 'USD', 'PLA',
	'[{"key":"url","label":"Destination URL","type":"url","required":true},{"key":"businessName","label":"Business name","type":"text","required":true,"maxLength":40},{"key":"brandColor","label":"Brand color","type":"color","required":true}]',
	'{"dimensions":"4 × 6 in","proofIncluded":true,"localPickup":true}', 3, 5, 1, 1, 20
);--> statement-breakpoint
INSERT OR IGNORE INTO `products` (
	`id`, `slug`, `sku`, `name`, `short_description`, `description`, `category`,
	`product_type`, `base_price_cents`, `compare_at_price_cents`, `currency`,
	`material`, `personalization_schema_json`, `attributes_json`,
	`lead_time_min_days`, `lead_time_max_days`, `is_active`, `is_featured`, `sort_order`
) VALUES (
	'prod_lithophane', 'photo-lithophane-panel', 'BL-LITHO-001',
	'Custom Photo Lithophane', 'Turn a favorite photo into a dimensional light-catching keepsake.',
	'Your photo is translated into a detailed relief panel that reveals the image when placed near a light source.',
	'personalized-gifts', 'personalized', 3999, 4499, 'USD', 'PLA',
	'[{"key":"photoReference","label":"Photo reference","type":"file","required":true},{"key":"orientation","label":"Orientation","type":"select","options":["portrait","landscape"]}]',
	'{"size":"5 × 7 in","lightSourceIncluded":false,"photoReview":true}', 3, 6, 1, 1, 30
);--> statement-breakpoint
INSERT OR IGNORE INTO `products` (
	`id`, `slug`, `sku`, `name`, `short_description`, `description`, `category`,
	`product_type`, `base_price_cents`, `currency`, `material`, `attributes_json`,
	`lead_time_min_days`, `lead_time_max_days`, `is_active`, `is_featured`, `sort_order`
) VALUES (
	'prod_cable_kit', 'desk-cable-management-kit', 'BL-CABLE-001',
	'Desk Cable Management Kit', 'Six low-profile clips that keep charging and monitor cables in reach.',
	'A practical set of reusable cable guides sized for common charging, USB, and display cables.',
	'desk-accessories', 'made_to_order', 1699, 'USD', 'PETG',
	'{"pieces":6,"cableRange":"3–7 mm","mounting":"removable adhesive strips included"}',
	2, 4, 1, 0, 40
);--> statement-breakpoint
INSERT OR IGNORE INTO `products` (
	`id`, `slug`, `sku`, `name`, `short_description`, `description`, `category`,
	`product_type`, `base_price_cents`, `currency`, `material`,
	`personalization_schema_json`, `attributes_json`, `lead_time_min_days`,
	`lead_time_max_days`, `is_active`, `is_featured`, `sort_order`
) VALUES (
	'prod_place_cards', 'event-place-name-set', 'BL-EVENT-001',
	'Event Place Name Set', 'A coordinated set of 10 freestanding names for weddings and events.',
	'Personalized place names make each setting feel intentional and double as a guest keepsake.',
	'events', 'personalized', 4999, 'USD', 'PLA',
	'[{"key":"names","label":"Guest names","type":"textarea","required":true,"maxLength":500},{"key":"color","label":"Color","type":"color","required":true}]',
	'{"includedNames":10,"additionalNames":"quoted separately","proofIncluded":true}',
	4, 7, 1, 0, 50
);--> statement-breakpoint
INSERT OR IGNORE INTO `products` (
	`id`, `slug`, `sku`, `name`, `short_description`, `description`, `category`,
	`product_type`, `base_price_cents`, `currency`, `material`, `attributes_json`,
	`lead_time_min_days`, `lead_time_max_days`, `is_active`, `is_featured`, `sort_order`
) VALUES (
	'prod_prototype', 'startup-prototype-review', 'BL-PROTO-001',
	'Prototype Print Review', 'A hands-on printability review and first prototype for your own model.',
	'Upload an STL, OBJ, or 3MF file. We review geometry, material, finish, and timing before confirming the final quote.',
	'prototyping', 'service', 2900, 'USD', 'PLA',
	'{"startingPrice":true,"supportedFormats":["STL","OBJ","3MF"],"humanReview":true}',
	2, 5, 1, 0, 60
);--> statement-breakpoint
PRAGMA optimize;
