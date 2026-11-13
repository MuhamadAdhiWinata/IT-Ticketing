-- Tahap log/berkas (worklogs.stage_key, files.stage) berpindah dari kunci lama ke nama fase.
-- ASSIGN dipecah ke Baru/Diakui/Ditriase menurut waktu akui/triase; IN_PROGRESS dan DELEGATION ke
-- Menunggu Pemohon bila dibuat dalam interval menunggu, selain itu Dikerjakan. Aman dijalankan ulang.
UPDATE `worklogs` w JOIN `tickets` t ON t.`id` = w.`ticket_id` SET w.`stage_key` = CASE
	WHEN w.`stage_key` = 'REQUEST' THEN 'Baru'
	WHEN w.`stage_key` = 'ASSIGN' THEN CASE
		WHEN t.`triaged_at` IS NOT NULL AND w.`created_at` >= t.`triaged_at` THEN 'Ditriase'
		WHEN t.`acknowledged_at` IS NOT NULL AND w.`created_at` >= t.`acknowledged_at` THEN 'Diakui'
		ELSE 'Baru' END
	WHEN w.`stage_key` IN ('IN_PROGRESS', 'DELEGATION') THEN CASE
		WHEN t.`waiting_started_at` IS NOT NULL AND w.`created_at` >= t.`waiting_started_at`
			AND (t.`waiting_ended_at` IS NULL OR w.`created_at` < t.`waiting_ended_at`) THEN 'Menunggu Pemohon'
		ELSE 'Dikerjakan' END
	WHEN w.`stage_key` = 'COMPLETION' THEN 'Selesai'
	ELSE w.`stage_key` END
WHERE w.`stage_key` IN ('REQUEST', 'ASSIGN', 'IN_PROGRESS', 'DELEGATION', 'COMPLETION');
--> statement-breakpoint
UPDATE `files` f JOIN `tickets` t ON t.`id` = f.`ticket_id` SET f.`stage` = CASE
	WHEN f.`stage` = 'REQUEST' THEN 'Baru'
	WHEN f.`stage` = 'ASSIGN' THEN CASE
		WHEN t.`triaged_at` IS NOT NULL AND f.`uploaded_at` >= t.`triaged_at` THEN 'Ditriase'
		WHEN t.`acknowledged_at` IS NOT NULL AND f.`uploaded_at` >= t.`acknowledged_at` THEN 'Diakui'
		ELSE 'Baru' END
	WHEN f.`stage` IN ('IN_PROGRESS', 'DELEGATION') THEN CASE
		WHEN t.`waiting_started_at` IS NOT NULL AND f.`uploaded_at` >= t.`waiting_started_at`
			AND (t.`waiting_ended_at` IS NULL OR f.`uploaded_at` < t.`waiting_ended_at`) THEN 'Menunggu Pemohon'
		ELSE 'Dikerjakan' END
	WHEN f.`stage` = 'COMPLETION' THEN 'Selesai'
	ELSE f.`stage` END
WHERE f.`stage` IN ('REQUEST', 'ASSIGN', 'IN_PROGRESS', 'DELEGATION', 'COMPLETION');
