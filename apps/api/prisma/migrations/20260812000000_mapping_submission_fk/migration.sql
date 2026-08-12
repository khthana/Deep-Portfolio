-- The column has always been NOT NULL and has always held student_activity.id,
-- but nothing enforced it: a mapping could name a submission that was never
-- there, and deleting a submission left its mappings behind (#47).
--
-- CASCADE matches the other side of the same table — skill_id — and every
-- other child of student_activity. A mapping is evidence of a skill, and the
-- work it points at is what makes it evidence; when the work goes, so does it.
--
-- Any row whose student_activity_id names nothing would fail the constraint, so
-- it goes first. The database this was written against held no mapping rows at
-- all, but the only other copies of this schema are other people's, and a
-- migration that stops halfway through is worse than one that cleans up.
DELETE FROM "public"."portfolio_skill_activity_mapping" m
WHERE NOT EXISTS (
  SELECT 1
  FROM "public"."student_activity" sa
  WHERE sa."id" = m."student_activity_id"
);

ALTER TABLE "public"."portfolio_skill_activity_mapping" ADD CONSTRAINT "fk_skill_activity_submission" FOREIGN KEY ("student_activity_id") REFERENCES "public"."student_activity"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
