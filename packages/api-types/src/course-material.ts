import type { AttachmentDetailResp } from "./attachment";

/**
 * The slides and recordings hung off a section's weekly plan.
 *
 * Three endpoints and one shape between them: `GET /course-material` answers a
 * row per week, and `POST` and `DELETE` answer no `data` key at all — the
 * service returns nothing and `JSON.stringify` drops the key rather than
 * sending it as null (ADR-0033). Both are pinned with `not.toHaveProperty`, so
 * neither has a type here, and neither is missing one.
 *
 * The week itself belongs to the lesson plan, not to this feature; only the
 * three columns this endpoint selects off it are here. The rest of
 * `course_syllabus` waits for the lesson-plan pass (ADR-0029 §2).
 */

/**
 * `GET /course-material` — one week of the plan, with what was posted for it.
 *
 * `title` is nullable, and this is the field both sides denied until #68: the
 * column takes null, the endpoint selects it and hands it over untouched, and
 * an `as` over the whole array was covering the difference. `week_no` beside it
 * is a plain `smallint` and really is always there.
 *
 * A week with nothing posted still appears, with two empty attachment lists
 * rather than an absent `course_materials` — the reader that fills them answers
 * `{ file: [], url: [] }` when there is nothing to find.
 */
export type CourseMaterialWeek = {
  course_syllabus_id: number;
  week_no: number;
  title: string | null;
  course_materials: CourseMaterialDetail;
};

/**
 * The two halves of a week's material.
 *
 * `course_material.type` is what splits them: `LECTURE` on one side, `RECORD`
 * on the other. The split happens in the service, so a caller never sees the
 * column — it sees two lists that are each shaped like every other attachment
 * list in the system.
 */
export type CourseMaterialDetail = {
  lecture: AttachmentDetailResp;
  record: AttachmentDetailResp;
};
