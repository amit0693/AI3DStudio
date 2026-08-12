CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`hit_count` integer DEFAULT 0 NOT NULL,
	`expires_at_epoch` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rate_limits_expires` ON `rate_limits` (`expires_at_epoch`);