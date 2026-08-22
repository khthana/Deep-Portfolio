/**
 * How a student is named when some other feature's response points at one.
 *
 * Nothing whole is here. The student feature has endpoints of its own — the
 * classroom page, the e-Portfolio — and none of them has moved yet (#68). What
 * is here is what some other feature's response embeds: the first two are the
 * pieces the submission endpoints carry, and `StudentDetail` is what the
 * aggregate `/portfolio/public/:token` answers as `userData`. Each is in this
 * file rather than in the file of whichever feature moved first (ADR-0029 §2).
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
 * the user feature has not moved (#68).
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
