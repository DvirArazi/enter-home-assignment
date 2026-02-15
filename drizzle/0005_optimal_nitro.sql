WITH invalid_classrooms AS (
	SELECT
		`id`,
		((`id` * 5 + 1234567) % 78364164096) AS `value`
	FROM `classrooms`
	WHERE NOT (
		length(`code`) = 7
		AND `code` GLOB '[A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9][A-Z0-9]'
	)
)
UPDATE `classrooms`
SET `code` = (
	SELECT
		substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', CAST(`value` / 2176782336 AS INTEGER) % 36 + 1, 1) ||
		substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', CAST(`value` / 60466176 AS INTEGER) % 36 + 1, 1) ||
		substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', CAST(`value` / 1679616 AS INTEGER) % 36 + 1, 1) ||
		substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', CAST(`value` / 46656 AS INTEGER) % 36 + 1, 1) ||
		substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', CAST(`value` / 1296 AS INTEGER) % 36 + 1, 1) ||
		substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', CAST(`value` / 36 AS INTEGER) % 36 + 1, 1) ||
		substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', `value` % 36 + 1, 1)
	FROM invalid_classrooms
	WHERE invalid_classrooms.id = classrooms.id
)
WHERE id IN (SELECT id FROM invalid_classrooms);

CREATE UNIQUE INDEX `classrooms_code_unique` ON `classrooms` (`code`);
