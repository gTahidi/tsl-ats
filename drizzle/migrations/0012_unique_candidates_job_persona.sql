-- Enforce uniqueness of candidate per (job, persona)
-- NOTE: If duplicates exist, this migration will fail. Resolve duplicates first.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM (
      SELECT job_id, persona_id, COUNT(*) AS cnt
      FROM candidates
      GROUP BY job_id, persona_id
      HAVING COUNT(*) > 1
    ) dups
  ) THEN
    RAISE EXCEPTION 'Cannot create unique index candidates_job_persona_unique: duplicate (job_id, persona_id) rows exist.';
  END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS candidates_job_persona_unique ON candidates (job_id, persona_id);
