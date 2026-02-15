CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`instructions` text DEFAULT '' NOT NULL,
	`files` text DEFAULT '[]' NOT NULL,
	`submission_date` integer NOT NULL,
	`classroom_id` integer NOT NULL,
	FOREIGN KEY (`classroom_id`) REFERENCES `classrooms`(`id`) ON UPDATE no action ON DELETE cascade
);
