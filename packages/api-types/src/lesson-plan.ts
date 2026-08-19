import type { CourseMaterialDetail } from "./course-material";

/**
 * The weekly plan of a section — `course_syllabus`, one row per week.
 *
 * Six endpoints answering five shapes, four of which are named here: three of
 * those four are the same row with something added or nothing added, the fourth
 * is an id, and the fifth belongs to `/options` and stays where it is.
 *
 * - `GET /lesson-plan` answers `LessonPlanWeek` — the row plus the names of the
 *   work planned in it.
 * - `GET /lesson-plan/student` answers `StudentLessonPlanWeek` — the same,
 *   plus the week's material, and showing only work whose announcement date has
 *   arrived.
 * - `PUT /lesson-plan` answers `LessonPlanRow` — the row it updated, with no
 *   list beside it, because the list is something the two reads build.
 * - `POST` and `DELETE` answer `LessonPlanIdResp`.
 * - `GET /lesson-plan/options` answers `{ label, value }` and has no type here,
 *   for the reason ADR-0032 gave about `/activity/options` and ADR-0036 §2
 *   extended to `/score-weight/options`.
 *
 * Almost every column is nullable. `week_no` and `id` are not, and everything
 * else on the row is — including `section_id`, which the schema lets be null
 * even though `addLessonPlanBody` requires it, and which the zod schema's own
 * comment explains: a week written without a section can never be read back,
 * because every read filters by one.
 */

/**
 * The row itself, as `PUT` answers it.
 *
 * The web wrote this out with `year`, `semester` and `subject_id` on it, which
 * are not columns of this table and have never been sent; it left out
 * `section_id`, which always is; and it said `created_at` and `updated_at` were
 * `Date` and could not be null, where they are nullable strings on the wire
 * (#68).
 *
 * `updated_at` is not what its name suggests, the same as on the score
 * categories: the column has a default and no `@updatedAt` behind it, so a
 * `PUT` hands back the value the row was created with.
 */
export type LessonPlanRow = {
  id: number;
  week_no: number;
  title: string | null;
  description: string | null;
  remark: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  section_id: number | null;
};

/**
 * `GET /lesson-plan` — a week of the plan and what is planned in it.
 *
 * `allActivities` is names only: the assessed work first and the classroom work
 * after it, which is the order the service concatenates the two tables in. It
 * is a list the read builds, not a column, which is why `PUT` does not carry
 * it.
 */
export type LessonPlanWeek = LessonPlanRow & {
  allActivities: string[];
};

/**
 * `GET /lesson-plan/student` — the same week as the student sees it.
 *
 * Two differences from the teacher's read, and only one of them is in the type:
 * the material is here, and `allActivities` leaves out work whose announcement
 * date has not arrived.
 *
 * `course_materials` is nullable for a narrow reason. The material this looks
 * the week up in is itself a row per week of the same section, so a week that
 * exists always finds itself and gets two empty attachment lists rather than
 * null. The fallback only fires if a week is deleted between the two reads.
 */
export type StudentLessonPlanWeek = LessonPlanWeek & {
  course_materials: CourseMaterialDetail | null;
};

/**
 * `POST /lesson-plan` and `DELETE /lesson-plan` — the id of the week that was
 * written or removed.
 *
 * An object rather than a bare number, so it has a name: a reader has to know
 * the key to get the value out, which is the line ADR-0036 draws.
 */
export type LessonPlanIdResp = {
  lesson_plan_id: number;
};
