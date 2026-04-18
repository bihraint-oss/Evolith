ALTER TABLE `diagnosis_sessions` ADD `state` text DEFAULT 'inProgress' NOT NULL;
--> statement-breakpoint
UPDATE `diagnosis_sessions`
SET `state` = 'completed'
WHERE `completed_at` IS NOT NULL;
