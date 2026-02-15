CREATE TABLE `classrooms` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`teacher_id` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
