CREATE TABLE `cognitive_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`creativity` integer DEFAULT 0 NOT NULL,
	`imagination` integer DEFAULT 0 NOT NULL,
	`prompt_precision` integer DEFAULT 0 NOT NULL,
	`system_decomposition` integer DEFAULT 0 NOT NULL,
	`ai_orchestration` integer DEFAULT 0 NOT NULL,
	`last_diagnosed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cognitive_profiles_user_id_unique` ON `cognitive_profiles` (`user_id`);--> statement-breakpoint
CREATE TABLE `diagnosis_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`questions` text NOT NULL,
	`answers` text NOT NULL,
	`profile_snapshot` text,
	`completed_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `skill_nodes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`dimension` text NOT NULL,
	`difficulty` integer NOT NULL,
	`prerequisites` text NOT NULL,
	`completion_criteria` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "skill_nodes_difficulty_check" CHECK("skill_nodes"."difficulty" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE `user_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`skill_node_id` text NOT NULL,
	`status` text NOT NULL,
	`started_at` text,
	`completed_at` text,
	`score` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`skill_node_id`) REFERENCES `skill_nodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_progress_user_id_skill_node_id_unique` ON `user_progress` (`user_id`,`skill_node_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);