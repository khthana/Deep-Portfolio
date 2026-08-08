import {
  createCourse,
  createTeacher,
  enrolStudent,
  type CourseOptions,
  type CreatedCourse,
} from "../factories";
import { BASELINE } from "../seed";

/**
 * Arranging the classroom a student-side case reads from.
 *
 * These are not factories — they write nothing the factories cannot — but they
 * are the same three lines of arrangement that every case about "a student and
 * the course they take" begins with, and they were copied between two files
 * before they lived here.
 */

/** The term the term-aware endpoints are asked about, in the shape they take it
 *  — a query string, not a foreign key. */
export const TERM = {
  semester: BASELINE.term.semester,
  academic_year: BASELINE.term.academic_year,
};

/**
 * Far enough ahead that no case has to think about when it is being run. Used
 * for a deadline that must stay in the future and for an announcement date that
 * must never arrive.
 *
 * A Gregorian year, deliberately: the Buddhist-era years this codebase is full
 * of (`admission_year: "2565"`) are strings on their way out of Postgres, never
 * `Date`s, and writing one here would read as 2025 while behaving as 2568.
 */
export const FAR_FUTURE = new Date("2999-01-01T00:00:00Z");

/**
 * A course in the current term that the student is enrolled in.
 *
 * The teacher is not scenery. Both endpoints that list a student's courses go
 * through `getCourseDetail`, which returns null for a section nobody teaches,
 * and the null is filtered out — so a teacherless section drops out of the list
 * and takes its activities with it. There are cases pinning that; everywhere
 * else a teacher is arranged so the case can be about something else.
 */
export async function enrolledCourse(
  student_id: string,
  options: CourseOptions = {},
): Promise<CreatedCourse> {
  const teacher = await createTeacher();
  const course = await createCourse({
    teacher_id: teacher.user_id,
    ...options,
  });
  await enrolStudent(course.section_id, student_id);
  return course;
}
