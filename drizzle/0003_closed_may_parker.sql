CREATE TABLE `personalization_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`object_key` text NOT NULL,
	`access_token_hash` text NOT NULL,
	`original_filename` text NOT NULL,
	`content_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`sha256` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "personalization_uploads_byte_size_positive" CHECK("personalization_uploads"."byte_size" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_personalization_uploads_object_key_unique` ON `personalization_uploads` (`object_key`);--> statement-breakpoint
CREATE INDEX `idx_personalization_uploads_expires` ON `personalization_uploads` (`expires_at`);