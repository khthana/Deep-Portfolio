import type { ActivityType } from "./activity";
import type { Weekday } from "./course";
import type { LearningActivityType } from "./learning-activity";
import type { StudentActivityStatusDB } from "./student-activity";

/**
 * What a student reads about their own studies, and the one thing a teacher
 * reads about a student — `/student`.
 *
 * Ten endpoints. Seven of them are reads about *me*: the term's courses, the
 * work in one section, the work across all of them, the calendar the first of
 * those three builds itself from, the subjects and the activities the
 * e-Portfolio offers as choices, and one submission in full. Two are the
 * handing-in itself, and they answer shapes
 * that already live in `student-activity.ts` and `student-learning-activity.ts`
 * — a submission is the same thing whoever asks. The tenth, `/student/list`,
 * is not about me at all: it is a class roster, and it belongs to the teacher
 * who teaches the section.
 *
 * `GET /student/course/list` has no type of its own either. It answers
 * `CourseDetail[]`, the shape the pilot pass moved, because it is
 * `getCourseDetail` run once per section the student is enrolled in.
 *
 * The first three types below came here before the rest: they are what some
 * other feature's response embeds, and each moved with whichever feature
 * needed it first (ADR-0029 §2).
 */

/** What a detail response sends: the name, without the id it was looked up by. */
export type StudentFullNameTh = {
  first_name_th: string;
  last_name_th: string;
};

/** What a roster sends: the same name, plus the id the row is keyed on. */
export type StudentNameBrief = StudentFullNameTh & {
  student_id: string;
};

/**
 * `GET /user/student` — who the signed-in student is, for a screen that shows
 * a name and a way to reach them.
 *
 * Here rather than in a file of the user feature's own because the aggregate
 * `/portfolio/public/:token` embeds it as `userData`, and a shape one feature
 * embeds moves when the embedder needs it (ADR-0031, ADR-0043 §3). The rest of
 * that feature followed a pass later and is in `user.ts`; this one stayed here.
 *
 * Every field is a plain `string`, and that is not what either the columns or
 * the API's own copy said. Five of the ten columns take null — `full_name_th`,
 * `title_th`, `phone`, and the department and programme names read through a
 * relation — while the old copy marked four fields nullable: three of those
 * five, plus `email`, whose column is `@unique` and not null at all. Neither
 * count reaches a caller, because the service coalesces every field to `""`
 * before answering. A caller sees an empty string, which is a different thing
 * to test for.
 *
 * `user_id` and `student_id` are both here and always carry the same string:
 * `student.student_id` is a foreign key onto `users.user_id`, so the row is
 * keyed by the id the session carries. Two names for one value, and this shape
 * answers with both.
 */
export type StudentDetail = {
  user_id: string;
  student_id: string;
  full_name_th: string;
  first_name_th: string;
  last_name_th: string;
  title_th: string;
  email: string;
  phone: string;
  department_name: string;
  program_name: string;
};

/**
 * `GET /student/list` — who is in this section, for the teacher who teaches it.
 *
 * `StudentNameBrief` already says what a roster row is, so this adds the one
 * thing the teacher's table actually draws with: the generated full name.
 *
 * Four fields, which is seven fewer than the `student` table has. Until #68 the
 * query had no `select` at all, so every column went out — `department_id`,
 * `program_id`, `status`, `admission_year`, `created_at`, `updated_at`, and a
 * column literally named `test`. Nothing has ever read any of them: the table
 * draws `full_name_th` and keys its rows on `student_id`. See
 * BEHAVIOR-CHANGES.md, and ADR-0044 §1 for why a query with no `select` is the
 * absence of a decision rather than one.
 *
 * `full_name_th` is nullable because the column is: Postgres generates it from
 * the two name columns, and a row written with the default overridden can hold
 * null. The two names themselves cannot.
 */
export type StudentRosterEntry = StudentNameBrief & {
  full_name_th: string | null;
};

/**
 * Which of the two tables a classwork row came out of.
 *
 * The classwork lists are the only responses that merge the graded activities
 * and the learning activities into one array, so they are the only ones that
 * need a field saying which. Every other endpoint answers one kind or the
 * other and the route says which.
 */
export type ClassworkCategory = "activity" | "learning_activity";

/**
 * A classwork row's `type`, which is `activities.activity_type` on one half of
 * the list and `learning_activities.learning_activity_type` on the other.
 *
 * Written as the two unions together rather than spelled out a third time:
 * `ActivityType` and `LearningActivityType` are deliberately separate because
 * they are different columns under different schemas, and this list carries
 * rows from both. If either gains a value, a classwork row can hold it, and
 * this widens with it — which is the point.
 *
 * Both halves upper-case the column before answering. The calendar, reading
 * the same two columns, does not — see `CalendarClassworkEvent`.
 */
export type ClassworkType = ActivityType | LearningActivityType;

/**
 * A classwork row's `status`, which is not only the column.
 *
 * `getDisplayStatus` in the two "all submissions" services compares the
 * deadline to the clock and answers `LATE` where the column says
 * `NOT_SUBMITTED`, so `GET /student/classwork/list` can send a fifth value
 * that is stored nowhere. `GET /student/all/classwork/list` does not call it
 * and sends the column untouched — it works out lateness for itself, by
 * putting the row in the `late` bucket, so it has no use for the word.
 *
 * That asymmetry is deliberate and not drift: one screen reads the status, the
 * other reads which bucket the row arrived in. The union is written once, as
 * everything either endpoint can send, because both fill the same row type.
 *
 * `GRADING` is in here because `StudentActivityStatusDB` has it, and nothing in
 * apps/api writes it today. If something ever does, the classwork card draws
 * neither a word nor an icon nor a colour for it — the same gap #69 records on
 * the evaluation table, on a second screen.
 */
export type ClassworkStatus = StudentActivityStatusDB | "LATE";

/**
 * One piece of work on a student's list, whichever of the two tables it is
 * from and whichever of the two lists it is in.
 *
 * `id` is the submission's id, not the activity's — `student_activity.id` or
 * `student_learning_activity.id`. The activity is reached through the section
 * and the category instead, which is what the card's link is built from.
 *
 * `date` and `deadline_date` are the same value: the mapper reads the deadline
 * once and writes it to both. `date` is what the grouping and sorting read,
 * `deadline_date` is what the card draws.
 *
 * A learning activity has neither a score nor a score category, so `point`,
 * `received_point` and `score_weight_id` are hard-coded null on that half
 * rather than read from anywhere.
 *
 * `section_id` falls back to 0 when the column is null, which it can be:
 * `activities.section_id` and `learning_activities.section_id` are both
 * nullable. Until #68 the learning-activity half of `GET
 * /student/classwork/list` sent 0 for *every* row, because its query selected
 * neither `section_id` nor `detail` and the `as` cast said otherwise — see
 * BEHAVIOR-CHANGES.md.
 */
export type ClassworkDetail = {
  /** The submission's id, not the activity's. */
  id: number;
  name: string;
  category: ClassworkCategory;
  type: ClassworkType;
  /** `activities.score_number` — what the work is out of. Null on the learning half. */
  point: number | null;
  /** What this student got. Null on the learning half, and until it is marked. */
  received_point: number | null;
  /** The deadline, the same value as `deadline_date`. */
  date: string | null;
  status: ClassworkStatus;
  /** The subject's English name, or "" when the section names no subject. */
  course: string;
  score_weight_id: number | null;
  subject_id: string;
  /** The tiptap document the teacher wrote. The API does not look inside it. */
  detail: unknown;
  /** 0 when the row's own `section_id` is null. */
  section_id: number;
  deadline_date: string | null;
  announcement_date: string | null;
};

/**
 * `GET /student/classwork/list` — one section's work, grouped for the page
 * that lists it.
 *
 * `today` is whatever is due today; everything else is grouped under a title,
 * which is the score category for a graded activity, "กิจกรรมการเรียนรู้" for
 * the whole learning half, and "อื่น ๆ" for an activity with no category. The
 * groups are in the order the rows were read, not sorted.
 */
export type ClassworkDetailResp = {
  today: ClassworkDetail[];
  other: { title: string; classworks: ClassworkDetail[] }[];
};

/**
 * `GET /student/all/classwork/list` — every section's work at once, sorted into
 * the four buckets the home page draws.
 *
 * A row is `submitted` as soon as its status is anything but `NOT_SUBMITTED`,
 * which is why nothing here is ever `LATE`: lateness is the bucket, not the
 * status. A row with no deadline is `upcoming`. The first three are sorted by
 * date; `submitted` is left in the order it was read.
 */
export type AllClassworkDetailResp = {
  late: ClassworkDetail[];
  this_week: ClassworkDetail[];
  upcoming: ClassworkDetail[];
  submitted: ClassworkDetail[];
};

/**
 * One piece of work on the calendar.
 *
 * Not `ClassworkDetail` cut down. The calendar reads the two tables itself
 * rather than going through the mapper, and the three fields it shares are
 * each answered differently:
 *
 * - `type` is the raw column, lower case as it is stored. The classwork lists
 *   upper-case theirs. The package's job is to say which does what
 *   (ADR-0037), so this one is `string` and `ClassworkType` is not.
 * - `status` is the column and only the column — no `getDisplayStatus` here,
 *   so `LATE` is impossible and `GRADING` is not.
 * - `course` is the subject's English name, looked up by section in the term's
 *   course list, and it is never missing: the section ids the two queries
 *   filter on are read off that same list, so every row they return has a
 *   match. The service's `""` fallback is unreachable and exists only because
 *   a lookup has to be total.
 */
export type CalendarClassworkEvent = {
  /** The submission's id, as on `ClassworkDetail`. */
  id: number;
  name: string;
  deadline_date: string | null;
  /** The column as stored — lower case, and not narrowed to two values. */
  type: string;
  status: StudentActivityStatusDB;
  /** The subject's English name. */
  course: string;
};

/**
 * One timetabled class on the calendar — a section, placed by its schedule.
 *
 * Read off the same `CourseDetail` the term's course list answers, so all four
 * schedule fields are nullable for the same reason they are there: a section
 * with no timetable row has none of them.
 */
export type CalendarCourseEvent = {
  /** The section id. */
  id: number;
  /** The subject's English name. */
  name: string;
  day_of_week: Weekday | null;
  start_time: string | null;
  end_time: string | null;
  classroom: string | null;
};

/**
 * `GET /student/calendar` — the term, in the three kinds of thing the page
 * lays out by date.
 *
 * Work whose announcement date has not arrived is left out of the first two
 * lists; work that was never given one is in from the start (ADR-0005).
 */
export type CalendarEventResp = {
  activities: CalendarClassworkEvent[];
  learning_activities: CalendarClassworkEvent[];
  courses: CalendarCourseEvent[];
};

/**
 * `GET /student/enrolled/subjects` — one row per enrolment, for the picker
 * that asks which subject a portfolio work came from.
 *
 * Every term, not just the current one, and keyed on the section rather than
 * the subject: a student who took the same subject twice gets two rows.
 */
export type EnrolledSubject = {
  section_id: number;
  subject_name_en: string;
  subject_name_th: string;
};

/**
 * `GET /student/activities/list` — every graded activity in one section, with
 * this student's own submission beside it, for the picker that asks which
 * piece of work a skill was demonstrated in.
 *
 * Every activity is listed whether or not there is a submission, so the last
 * four fields are all null together: no `student_activity` row for this
 * student on this activity. They are null separately too — a row exists but
 * has no score yet, or no feedback.
 *
 * Learning activities are not here. The e-Portfolio maps skills onto graded
 * work only.
 */
export type SectionActivityOption = {
  activity_id: number;
  activity_name: string;
  /** The submission's id, or null when this student has none. */
  student_activity_id: number | null;
  status: StudentActivityStatusDB | null;
  /** `Decimal(5,2)`, converted — a string on the wire otherwise (#33). */
  score: number | null;
  feedback: string | null;
};

/**
 * `GET /student/activities/details/:student_activity_id` — one of my
 * submissions, with the subject it was handed in for.
 *
 * Ten fields off the row, three off the activity it was handed in against, and
 * a `course` block the service assembles rather than selects. Until #68 the
 * query had no
 * `select` and an `include` four tables deep behind it, so the response also
 * carried `graded_by`, `created_at` and `updated_at`, every column of
 * `activities`, and then `subject_score_ratio` → `course_sections` →
 * `semester_courses` → `subjects` in full — which reaches the same subject the
 * `course` key below already names, by a longer road. See BEHAVIOR-CHANGES.md
 * and ADR-0044 §1.
 *
 * Named for what it holds rather than for its route. `StudentActivityDetail`
 * would have sat one suffix away from `StudentActivityDetailResp` in a flat
 * namespace, and the two are different shapes for different screens — which
 * is the collision ADR-0029 §1 is about.
 *
 * `course` is optional and genuinely absent, not null: the service only adds
 * the key when the activity names a section and that section is found
 * (ADR-0033). `course_id` on it is the *subject* id, which is what the column
 * is called at the other end of that lookup.
 */
export type SubmissionWithCourse = {
  /** The submission's id. */
  id: number;
  student_id: string;
  activity_id: number;
  status: StudentActivityStatusDB;
  /** `Decimal(5,2)`, converted — a string on the wire otherwise (#33). */
  score: number | null;
  feedback: string | null;
  submitted_at: string | null;
  graded_at: string | null;
  is_bookmark: boolean;
  remark: string | null;
  activities: {
    /** The activity's own id — the same number as `activity_id` above. */
    id: number;
    activity_name: string;
    section_id: number | null;
  };
  course?: {
    /** The subject id, not a section or a course row. */
    course_id: string;
    course_name_en: string;
    course_name_th: string;
  };
};
