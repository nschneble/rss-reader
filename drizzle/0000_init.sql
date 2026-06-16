CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`feed_id` integer NOT NULL,
	`guid` text NOT NULL,
	`title` text NOT NULL,
	`url` text,
	`author` text,
	`content` text,
	`summary` text,
	`published_at` integer,
	`fetched_at` integer DEFAULT (unixepoch()) NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`is_starred` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`feed_id`) REFERENCES `feeds`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_feed_guid_unique` ON `articles` (`feed_id`,`guid`);--> statement-breakpoint
CREATE INDEX `articles_feed_idx` ON `articles` (`feed_id`);--> statement-breakpoint
CREATE INDEX `articles_published_idx` ON `articles` (`published_at`);--> statement-breakpoint
CREATE INDEX `articles_starred_idx` ON `articles` (`is_starred`);--> statement-breakpoint
CREATE INDEX `articles_read_idx` ON `articles` (`is_read`);--> statement-breakpoint
CREATE TABLE `feeds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`site_url` text,
	`description` text,
	`icon_url` text,
	`folder_id` integer,
	`last_fetched_at` integer,
	`last_error` text,
	`etag` text,
	`last_modified` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `feeds_url_unique` ON `feeds` (`url`);--> statement-breakpoint
CREATE INDEX `feeds_folder_idx` ON `feeds` (`folder_id`);--> statement-breakpoint
CREATE TABLE `folders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `folders_name_unique` ON `folders` (`name`);