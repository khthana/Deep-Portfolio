/**
 * What the course endpoints answer with — GET /course/list, GET /course,
 * GET /course/clo and GET /course/plo/list.
 *
 * These are the first feature moved here, and every one of them is annotated
 * onto the service that answers it: `CourseDetail`, `CourseDetailBrief` and
 * `TeacherCourseListResp` onto apps/api/src/services/course.service.ts,
 * `CLOResp` and `PLOResp` onto clo.service.ts and plo.service.ts. The last two
 * used to hand a Prisma row to res.json() whole, which holds `Date` where the
 * caller reads a string; they now write the timestamps out as toISOString()
 * themselves, which is the same bytes JSON.stringify was already producing and
 * is what lets the compiler check them against this file. See
 * docs/adr/0028-shared-api-types.md.
 */

/** The `weekday` enum in the database, spelled as the wire spells it. */
export type Weekday = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export type CourseDetail = {
  // Null together: when the section has nobody teaching it yet — an ordinary
  // state for a section that has just been imported, not a broken row — and
  // also when its teacher row names a user that is not in `users`, which
  // nothing stops it from doing (`course_sections_teacher.user_id` has no
  // foreign key). See docs/adr/0021-section-without-teacher.md.
  teacher_name_th: string | null;
  teacher_name_en: string | null;
  teacher_email: string | null;
  teacher_phone: string | null;
  teacher_id: string | null;
  section_id: number;
  section_number: string;
  course_name_th: string;
  course_name_en: string;
  course_id: string;
  credits: number;
  course_desc_th: string;
  course_desc_en: string;
  academic_year: string;
  semester: number;
  program_id: string;

  day_of_week: Weekday | null;
  start_time: string | null;
  end_time: string | null;
  classroom: string | null;
};

export type CourseDetailBrief = {
  section_number: string;
  section_id: number;
  course_name_th: string;
  course_name_en: string;
  course_id: string;
  academic_year: string;
  semester: number;

  day_of_week: Weekday | null;
  start_time: string | null;
  end_time: string | null;
  classroom: string | null;
};

export type TeacherCourseListResp = {
  teacher_id: string;
  active_courses: CourseDetailBrief[];
  archived_courses: CourseDetailBrief[];
};

/** The `learning_outcome_type` enum in the database. */
export type LearningOutcomeType =
  "knowledge" | "skills" | "ethics" | "character";

/** One programme learning outcome — the whole `learning_outcomes` row. */
export type PLOResp = {
  outcome_id: number;
  program_id: string;
  outcome_code: string;
  outcome_title: string;
  outcome_description: string | null;
  outcome_type: LearningOutcomeType;
  parent_outcome_id: number | null;
  sequence_order: number;
  level_depth: number | null;
  is_expanded: boolean | null;
  is_active: boolean | null;
  /** ISO 8601 — JSON.stringify writes a Date as its toJSON(). */
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  section_id: number | null;
};

/**
 * One course learning outcome, with the PLO it maps onto flattened into the
 * same object rather than nested under a key of its own.
 */
export type CLOResp = {
  // The PLO's three fields, and all three are absent — not null — when the
  // outcome maps onto no PLO, or onto one that has since gone: the service
  // spreads the fields of a row it did not find, and JSON.stringify drops the
  // keys whose value is undefined.
  outcome_code?: string;
  outcome_title?: string;
  outcome_description?: string | null;

  clo_id: number;
  clo_number: string | null;
  clo_detail: string | null;
  teaching_method: string | null;
  assessment_method: string | null;
  created_at: string | null;
  updated_at: string | null;
  section_id: number;
  plo_id: number | null;
  created_by: string | null;
};
